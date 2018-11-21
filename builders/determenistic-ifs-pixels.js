class DetermenisticIFSPixel {
    constructor(canvas, table, demoColor, figure) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.states = [];   // Массив состояний объектов каждой итерации
        this.dirty = false; // Флаг обновления холста

        this.iteration = 0; // Текущая итерация
        
        this.table = table; // Таблица IFS

        this.demoColor = demoColor || false; // 
        this.heatmap = false;

        // Привязываем методы к классу
        this.initializeCanvas = this.initializeFromCanvas.bind(this);
        this.nextIteration = this.nextIteration.bind(this);
        this.prevIteration = this.prevIteration.bind(this);
        this.draw = this.draw.bind(this);

        if (figure) {
            // Если в конструктор передана фигура, нарисовать её на холсте
            figure.draw(this.canvas, this.ctx);
        } else {
            // Иначе, по умолчанию рисуем квадрат
            let ctx = this.ctx;
            ctx.beginPath();

            let side = 100;
            ctx.moveTo(0, 0);
            ctx.lineTo(0, side);
            ctx.lineTo(side, side);
            ctx.lineTo(side, 0);
            ctx.lineTo(0, 0);
            ctx.fill();
        }

        // Инициализируем метод из содержимого холста
        this.initializeFromCanvas();
        // Запускаем цикл отрисовки
        requestAnimationFrame(this.draw);
    }

    initializeFromCanvas() {
        // Инициализация заключается в сохранении текущего состояния холста в массив состояний
        var data = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.states.push(data);
    }

    // Получает из ImageData значения, соответствующие цвету RGBA в (x, y)
    getPixel(id, x, y) {
        let cellOffset = (Math.floor(y) * id.width + Math.floor(x)) * 4;
        return [
            id.data[cellOffset++],
            id.data[cellOffset++],
            id.data[cellOffset++],
            id.data[cellOffset]
        ];
    }

    // Устанавливает в объекте ImageData значения, соответствующие цвету RGBA в (x, y)
    setPixel(id, x, y, red, green, blue, alpha) {
        let cellOffset = (Math.floor(y) * id.width + Math.floor(x)) * 4;
        id.data[cellOffset++] = red;
        id.data[cellOffset++] = green;
        id.data[cellOffset++] = blue;
        id.data[cellOffset] = alpha;
    }

    // Проверяет, "установлен" ли пиксель с координатами (x, y) 
    isSet(id, x, y) {
        let cellOffset = (y * id.width + x) * 4;
        return id.data[cellOffset + 3] == 255;
    }

    nextIteration() {
        if (this.iteration == this.states.length - 1) {
            // Для чистоты исходного кода, сохраняем ссылку на предыдущее состояние
            var prevState = this.states[this.iteration];
            // Создаем ImageData для нового состояния
            var newState = new ImageData(prevState.width, prevState.height);
            var i, x, y, a, b, c, d, e, f, red, green, blue;

            // Засекаем время итерации
            let startTime = performance.now();
            for (x = prevState.width - 1; x >= 0; --x) {
                for (y = prevState.height - 1; y >= 0; --y) {
                    // Для всех пикселей предыдущего состояния, проверяем, установлен ли пиксель
                    if (this.isSet(prevState, x, y)) {
                        // Если пиксель установлен, обрабатываем его:
                        for (i = this.table.length - 1; i >= 0; --i) {
                            // Извлекаем коэффициенты из таблицы
                            a = this.table[i][0];
                            b = this.table[i][1];
                            c = this.table[i][2];
                            d = this.table[i][3];
                            e = this.table[i][4] * this.canvas.width;
                            f = this.table[i][5] * this.canvas.height;

                            let originalColors = this.getPixel(prevState, x, y);
                            if (!this.heatmap) {
                                if (!this.demoColor) {
                                    // Цвета предыдущего пикселя
                                    red = originalColors[0];
                                    green = originalColors[1];
                                    blue = originalColors[2];
                                } else {
                                    // Цвета демонстрации
                                    red = this.demoColor && i % 3 == 0 ? 255 : 0;
                                    green = this.demoColor && i % 3 == 1 ? 255 : 0;
                                    blue = this.demoColor && i % 3 == 2 ? 255 : 0;
                                }
                            } else {
                                // Цвета Heatmap
                                red = originalColors[0] + 10;
                                green = originalColors[1];
                                blue = originalColors[2];
                            }
                            // Ставим пиксель
                            this.setPixel(
                                newState,
                                (a * x) + (b * y) + e,
                                (c * x) + (d * y) + f,
                                red, green, blue, 255
                            );
                        }
                    }
                }
            }
            // Итерация завершена, фиксируем время
            this.iterationTime = performance.now() - startTime;
            // Добавляем результат в массив состояний
            this.states.push(newState);
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
            let ctx = this.ctx;
            // Очищаем холст
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            // Для чистоты исходного кода, сохраняем ссылку на нынешнее состояние
            let currentState = this.states[this.iteration];
            
            // Наносим на холст изображение текущего состояния, фиксируя время отрисовки
            let startTime = performance.now();
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

 

