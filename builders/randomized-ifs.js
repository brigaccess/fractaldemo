class RandomizedIFS {
    constructor(canvas, table, heatmap, colorChoice) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.states = [];   // Массив состояний холста для каждой итерации
        this.dirty = false; // Флаг обновления холста

        this.iteration = 0; // Текущая итерация
        this.step = 10000; // Количество точек в одной итерации

        this.table = table.table; // Таблица IFS
        this.heatmap = heatmap; // Флаг использования раскраски heatmap
        this.colorChoice = colorChoice; // Флаг использования раскраски в зависимости от выбранного преобразования IFS

        this.x = 0;
        this.y = 0;
        this.offsetX = table.offset ? table.offset[0] : 0;
        this.offsetY = table.offset ? table.offset[1] : 0;

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
        // Помещаем пустое изображение в массив состояний
        this.states.push(new ImageData(this.canvas.width, this.canvas.height))
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
    getPixel(id, width, x, y) {
        var cellOffset = (Math.floor(y) * width + Math.floor(x)) * 4;
        return [
            id.data[cellOffset++],
            id.data[cellOffset++],
            id.data[cellOffset++],
            id.data[cellOffset]
        ];
    }

    nextIteration() {
        // Проверяем, не отрисована ли эта итерация
        if (this.iteration == this.states.length - 1) {
            var prevState = this.states[this.iteration];

            var a, b, c, d, e, f, i, j, k, newx, newy, sum, red, green, blue, alpha;

            // Засекаем время итерации
            var startTime = performance.now()
            // Создаем массив нового состояния
            var newState = new Uint8ClampedArray(prevState.data);
            // Совершаем step итераций
            for (i = 0; i < this.step; i++) {
                // Выбираем случайное преобразование из таблицы IFS
                // Механизм следующий: для каждой строки, если сумма вероятностей всех предыдущих строк
                // и текущей строки больше, чем k, выбираем её и останавливаем перебор строк
                k = Math.random();
                sum = 0;
                for (j = 0; j < this.table.length; j++) {
                    sum += this.table[j][6]
                    if (sum >= k) {
                        // Извлекаем коэффициенты из таблицы
                        a = this.table[j][0];
                        b = this.table[j][1];
                        c = this.table[j][2];
                        d = this.table[j][3];
                        e = this.table[j][4];
                        f = this.table[j][5];

                        // Расчитываем координаты после преобразования
                        newx = a*this.x+b*this.y+e;
                        newy = c*this.x+d*this.y+f;
                        // Сохраняем координаты
                        this.x = newx;
                        this.y = newy;

                        if (this.iteration > 0 || i > 10) {
                            red = 0;
                            green = 0;
                            blue = 0;
                            // Высчитываем цвет пикселя
                            if (this.heatmap) {
                                // Heatmap
                                var originalColor = this.getPixel(prevState, prevState.width, this.x + this.offsetX, this.y + this.offsetY);
                                red = (originalColor[3] == 255) ? originalColor[0] + 5 : 0;
                                green = (originalColor[3] == 255 && originalColor[0] == 255) ? originalColor[1] + 5: 0;
                                blue = (originalColor[3] == 255) ? 255 - originalColor[0] : 255;
                            } else if (this.colorChoice) {
                                // Раскраска пикселей в зависимости от выбранной строки
                                red = (255 / this.table.length) * j;
                            }
                            this.setPixel(newState, prevState.width, this.x + this.offsetX, this.y + this.offsetY, red, green, blue, 255);
                        }
                        break;
                    }
                }
            }
            // Итерация завершена, фиксируем время
            this.iterationTime = performance.now() - startTime;
            // Создаем новый объект ImageData на основе данных newState и добавляем его в массив состояний
            this.states.push(new ImageData(newState, prevState.width, prevState.height));
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
            ctx.putImageData(currentState, 0, 0);
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