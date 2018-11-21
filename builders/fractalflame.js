// Массив вариаций. Элемент массива — анонимная функция переменных (x, y)
const FF_VARS = [
    // Linear
    (x, y) => [x, y],
    // Sinusoidal
    (x, y) => [x, y].map(Math.sin),
    // Spherical
    (x, y) => {
        var r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        return [x * 1/r, y * 1/r]
    },
    // Swirl
    (x, y) => {
        var r2 = Math.pow(x, 2) + Math.pow(y, 2);
        return [x * Math.sin(r2) - y * Math.cos(r2), x * Math.cos(r2) + y * Math.sin(r2)]
    },
    // Horseshoe
    (x, y) => {
        var r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        return [(x - y) * (x + y) * 1/r, 2 * x * y];
    }
];

class FractalFlame {
    constructor(canvas, table, postTransform, finalTransform) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.states = [];   // Массив состояний объектов каждой итерации
        this.dirty = false; // Флаг обновления холста

        this.iteration = 0; // Текущая итерация
        this.table = table; // Таблица IFS
        this.step = 1000000; // Количество точек в одной итерации

        this.x = 0;
        this.y = 0;
        this.color = Math.random();
        this.zoom = 50;
        this.offsetX = Math.floor(this.canvas.width / 2);
        this.offsetY = Math.floor(this.canvas.height / 2);
        
        this.postTransform = postTransform || ((x, y) => [x, y]); // Функция пост-преобразования
        this.finalTransform = finalTransform || ((x, y) => [x, y, 0]); // Окончательное преобразование

        // Привязываем методы к классу
        this.initialize = this.initialize.bind(this);
        this.nextIteration = this.nextIteration.bind(this);
        this.prevIteration = this.prevIteration.bind(this);
        this.draw = this.draw.bind(this);

        // Инициализируем метод
        this.initialize();
        // Запускаем цикл отрисовки
        requestAnimationFrame(this.draw);
    }

    initialize() {
        // Помещаем пустое изображение и пустой массив частоты попаданий в массив состояний
        this.states.push({
            image: new ImageData(this.canvas.width, this.canvas.height),
            freq: new Array(this.canvas.width * this.canvas.height)
        });
    }

    getColor(color)
    {
        // Функция, возвращающая цвет.
        // color принимает значения от 0 до 1
        var cscaled = Math.round(color * 255);
        return [Math.min(cscaled, 255), 0, 0];
    }

    // Устанавливает в массиве data значения, соответствующие цвету RGBA в (x, y)
    setPixel(data, width, x, y, red, green, blue, alpha) {
        var cellOffset = (Math.floor(y) * width + Math.floor(x)) * 4;
        data[cellOffset++] = red;
        data[cellOffset++] = green;
        data[cellOffset++] = blue;
        data[cellOffset] = alpha;
    }

    // Получает из массива data значения, соответствующие цвету RGBA в (x, y)
    getPixel(data, width, x, y) {
        var cellOffset = (Math.floor(y) * width + Math.floor(x)) * 4;
        return [
            data[cellOffset++],
            data[cellOffset++],
            data[cellOffset++],
            data[cellOffset]
        ];
    }

    nextIteration() {
        // Проверяем, не отрисована ли эта итерация
        if (this.iteration == this.states.length - 1) {
            // Объявляем все переменные во избежание частой сборки мусора в циклах
            var a, b, c, d, e, f, i, j, k, coeffs, variationVector, sum, prob, newx, newy, sumx, sumy, varied, final, finalColor, pixelX, pixelY, pixel, alpha, pixelColor, red, green, blue;
            var prevState = this.states[this.iteration];
            // Засекаем время итерации
            var startTime = performance.now()
            // Создаем массив нового состояния
            var newState = new Uint8ClampedArray(prevState.image.data);
            // Совершаем step итераций
            for (i = 0; i < this.step; i++) {
                // Выбираем случайное преобразование из таблицы IFS
                // Механизм следующий: для каждой строки, если сумма вероятностей всех предыдущих строк
                // и текущей строки больше, чем k, выбираем её и останавливаем перебор строк
                //
                // В случае, если вероятность равна единице, строка используется в любом случае
                sum = 0;
                for (j = 0; j < this.table.length; j++) {
                    sum += this.table[j].c[6];
                }
                k = Math.random() * sum;
                sum = 0;
                for (j = 0; j < this.table.length; j++) {
                    variationVector = this.table[j].vv;
                    coeffs = this.table[j].c;
                    // Получаем вероятность из строки
                    prob = coeffs[6];
                    sum += prob;
                    if (sum >= k || prob == 1) {
                        // Извлекаем коэффициенты из таблицы
                        a = coeffs[0];
                        b = coeffs[1];
                        c = coeffs[2];
                        d = coeffs[3];
                        e = coeffs[4];
                        f = coeffs[5];
                        // Расчитываем координаты после преобразования
                        newx = a*this.x+b*this.y+e;
                        newy = c*this.x+d*this.y+f;
                        
                        // Применяем вариации и суммируем их
                        sumx = 0;
                        sumy = 0;
                        for (k = variationVector.length - 1; k >= 0; --k) {
                            if (variationVector[k] != 0) {
                                varied = FF_VARS[k](newx, newy);
                                sumx += varied[0] * variationVector[k];
                                sumy += varied[1] * variationVector[k];
                            }
                        }
                        // Обновляем значение цвета
                        this.color = (this.color + this.table[j][7]) / 2;
                        // Применяем окончательное преобразование
                        final = this.finalTransform(sumx, sumy);
                        // Сохраняем координаты
                        this.x = final[0];
                        this.y = final[1];
                        // Высчитываем окончательный цвет
                        finalColor = (this.color + final[2]) / 2;

                        // При нанесении точки на холст, увеличиваем её alpha на 1
                        // по сравнению с предыдущим состоянием
                        if (this.iteration > 0 || i > 10) {
                            pixelX = Math.floor(this.x * this.zoom + this.offsetX);
                            pixelY = Math.floor(this.y * this.zoom + this.offsetY);
                            //console.log('Newx', newx, newy, 'sum', sumx, sumy, 'final', this.x, this.y, 'pix', pixelX, pixelY);
                            if (pixelX > 0 && pixelX < this.canvas.width && pixelY > 0 && pixelY < this.canvas.height) {
                                pixel = this.getPixel(newState, prevState.image.width, pixelX, pixelY);
                                alpha = Math.min(pixel[3] + 1, 255);
                                
                                pixelColor = this.getColor(finalColor);
                                red = pixelColor[0];
                                green = pixelColor[1];
                                blue = pixelColor[2];
                            
                                this.setPixel(newState, prevState.image.width, pixelX, pixelY, red, green, blue, alpha);
                            }
                        }
                        if (prob != 1) break;
                    }
                }
            }
            // Итерация завершена, фиксируем время
            this.iterationTime = performance.now() - startTime;
            // Создаем новый объект ImageData на основе данных newState и добавляем его в массив состояний
            this.states.push(
                {
                    image: new ImageData(newState, prevState.image.width, prevState.image.height)
                });
        }
        // Увеличиваем указатель на текущую итерацию и помечаем холст к перерисовке.
        this.iteration++;
        this.dirty = true;
    }

    prevIteration() {
        // Уменьшаем указатель на текущую итерацию и помечаем холст к перерисовке, если итерация больше нуля.
        if (this.iteration > 0) {
            this.iteration--;
            this.dirty = true;
        }
    }

    draw() {
        if (this.dirty) {
            var ctx = this.ctx;
            // Очищаем холст
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            // Для чистоты исходного кода, сохраняем ссылку на нынешнее состояние
            var currentState = this.states[this.iteration];

            // Наносим на холст изображение текущего состояния, фиксируя время отрисовки
            var startTime = performance.now();
            ctx.putImageData(currentState.image, 0, 0);
            this.drawTime = performance.now() - startTime;
            
            // Вызываем callback отрисовки, если он существует
            if (this.drawnCallback) this.drawnCallback();
            // Сбрасываем флаг перерисовки холста
            this.dirty = false;
        }
        // Продолжаем цикл отрисовки
        requestAnimationFrame(this.draw);
    }
}