class Figure {
    // Класс "Геометрическая фигура"
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width
        this.height = height;
        this.draw = this.draw.bind(this);
    }

    draw(canvas, context) {
        // Метод отрисовки
    }
}

class Triangle extends Figure {
    // Класс "Треугольник"
    draw(canvas, ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height);
        ctx.lineTo(this.x, this.y);
        ctx.fill();
    }
}

class DetermenisticIFS {
    constructor(canvas, table, figure) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.states = [];   // Массив состояний объектов каждой итерации
        this.dirty = false; // Флаг обновления холста

        this.iteration = 0; // Текущая итерация

        this.table = table;    // Таблица IFS
        this.figure = figure;  // Фигура для отрисовки

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
        // Инициализация метода заключается в добавлении начального состояния,
        // которое содержит в себе одну фигуру
        this.states.push([
            new this.figure(0, 0, this.canvas.width, this.canvas.height)
        ]);
    }

    nextIteration() {
        // Проверяем, не отрисована ли эта итерация
        if (this.iteration == this.states.length - 1) {
            var subpixelElements = 0;   // Счетчик элементов размером меньше пикселя

            // Для чистоты исходного кода, сохраняем ссылку на предыдущее состояние
            var prevState = this.states[this.iteration];

            var a, b, c, d, e, f, i, j, x, y, newWidth, newHeight, element, fig = this.figure;
            
            // Засекаем время итерации
            var startTime = performance.now();
            var newState = [];
            for (i = 0; i < prevState.length; i++) {
                // Получаем i элемент предыдущей итерации
                element = prevState[i];
                // Для каждого преобразования в таблице IFS
                for (j = 0; j < this.table.length; j++) {
                    // Извлекаем коэффициенты из таблицы
                    a = this.table[j][0];
                    b = this.table[j][1];
                    c = this.table[j][2];
                    d = this.table[j][3];
                    e = this.table[j][4] * this.canvas.width;
                    f = this.table[j][5] * this.canvas.height;
                    // Получаем координаты элемента предыдущей итерации
                    x = element.x;
                    y = element.y;
                    // Расчитываем размер нового элемента
                    newWidth = element.width * a;
                    newHeight = element.height * d;
                    // Проверяем, меньше ли размер нового элемента по сравнению с пикселем
                    if ((newWidth < 1 && element.width >= 1) || (newHeight < 1 && element.height >= 1)) {
                        // Если да, увеличиваем счетчик
                        subpixelElements++;
                    }
                    // Добавляем новый элемент к новому состоянию
                    newState.push(new fig((a * x) + (b * y) + e, (c * x) + (d * y) + f, newWidth, newHeight));
                }
            }
            // Итерация завершена, фиксируем время
            this.iterationTime = performance.now() - startTime;
            // Фиксируем количество элементов меньше пикселя
            this.subpixelElements = subpixelElements;
            
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
            var ctx = this.ctx;
            // Очищаем холст
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            // Для чистоты исходного кода, сохраняем ссылку на нынешнее состояние
            var currentState = this.states[this.iteration];
            var element;
            // Засекаем время отрисовки
            var startTime = performance.now();
            for (var i = 0; i < currentState.length; i++) {
                element = currentState[i];
                // Пропускаем элементы, чьи размеры меньше пикселя
                if (element.width < 1 || element.height < 1) continue;
                // Отрисовываем элемент
                element.draw(this.canvas, ctx);
            }
            // Отрисовка завершена, фиксируем время
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
 

