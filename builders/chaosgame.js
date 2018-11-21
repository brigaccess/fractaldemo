class ChaosGame {
    constructor(canvas, nVertices, fraction, drawFigure, rule) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.states = [];   // Массив состояний холста для каждой итерации
        this.dirty = false; // Флаг обновления холста

        this.iteration = 0; // Текущая итерация
        this.step = 10000;  // Количество точек в одной итерации
        
        this.nVertices = nVertices;            // Число вершин многоугольника
        this.fraction = fraction;              // Делитель для координат
        this.drawPolygon = drawFigure;          // Флаг отрисовки фигуры
        this.rule = rule || this.defaultRule;  // Функция выбора вершины

        this.vertices = []; // Массив координат вершин многоугольника

        this.x = 0;
        this.y = 0;

        // Привязываем методы к классу
        this.draw = this.draw.bind(this);
        this.initialize = this.initialize.bind(this);
        this.nextIteration = this.nextIteration.bind(this);
        this.prevIteration = this.prevIteration.bind(this);
        this.defaultRule = this.defaultRule.bind(this);
        this.rule = this.rule.bind(this);

        // Инициализируем метод
        this.initialize();
        // Запускаем цикл отрисовки
        requestAnimationFrame(this.draw);
    }

    defaultRule() {
        // По умолчанию выбор вершины случаен и не имеет ограничений
        return Math.floor(Math.random() * this.vertices.length);
    }

    initialize() {
        // Выбираем центральную точку
        var centerX = this.canvas.width / 2;
        var centerY = this.canvas.height / 2;

        // Представим окружность с центром в центре холста и радиусом
        var radius = Math.min(centerX, centerY) - 10;
        // Делим её на количество вершин, получаем угол дуги в радианах
        var segment = (2 * Math.PI) / this.nVertices;
        
        // Добавляем точки многоугольника в массив
        var pointX, pointY, pos = segment;
        for (var i = 0; i < this.nVertices; i++) {
            pointX = centerX + radius * Math.sin(pos);
            pointY = centerY + radius * Math.cos(pos);
            this.vertices.push({x: pointX, y: pointY});
            pos += segment;
        }

        // Выбираем случайную точку для начала
        this.x = Math.floor(Math.random() * this.canvas.width);
        this.y = Math.floor(Math.random() * this.canvas.height);

        // Сохраняем начальное состояние
        this.states.push(new ImageData(this.canvas.width, this.canvas.height));
        // Помечаем изменение в состоянии холста
        this.dirty = true;
    }

    // Устанавливает в массиве data значения, соответствующие цвету RGBA в (x, y)
    setPixel(data, width, x, y, red, green, blue, alpha) {
        var cellOffset = (Math.floor(y) * width + Math.floor(x)) * 4;
        data[cellOffset++] = red;
        data[cellOffset++] = green;
        data[cellOffset++] = blue;
        data[cellOffset] = alpha;
    }

    nextIteration() {
        // Проверяем, не отрисована ли эта итерация
        if (this.iteration == this.states.length - 1) {
            // Засекаем время итерации
            var startTime = performance.now();
            // Создаем массив нового состояния
            var newState = new Uint8ClampedArray(this.states[this.iteration].data);
            // Совершаем step итераций
            for (var i = 0; i < this.step; i++) {
                // Выбираем вершину
                var pointIndex = this.rule();
                var point = this.vertices[pointIndex];
                
                // Расчитываем расстояния от текущей точки до вершины по каждой координате
                var distanceX = point.x - this.x;
                var distanceY = point.y - this.y;
                
                // Задаем новые координаты текущей точки
                this.x = Math.floor(this.x + (distanceX * this.fraction));
                this.y = Math.floor(this.y + (distanceY * this.fraction));

                // Пропускаем 20 первых точек, не нанося их на холст
                if (this.iteration > 0 || i > 20) {
                    this.setPixel(newState, this.canvas.width, this.x, this.y, 0, 0, 0, 255);
                }
            }
            // Итерация завершена, фиксируем время
            this.iterationTime = performance.now() - startTime;
            
            // Создаем новый объект ImageData на основе данных newState и добавляем его в массив состояний
            this.states.push(
                new ImageData(newState, this.canvas.width, this.canvas.height)
            );
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

            // Наносим на холст изображение текущего состояния, фиксируя время отрисовки
            var startTime = performance.now();
            ctx.putImageData(this.states[this.iteration], 0, 0);
            this.drawTime = performance.now() - startTime;

            // Если запрошена отрисовка многоугольника, отрисовываем его
            if (this.drawPolygon) {
                var x, y, connectingPath = new Path2D();

                for (var i = 0; i < this.vertices.length; i++) {
                    x = this.vertices[i].x;
                    y = this.vertices[i].y;
                
                    if (i == 0) {
                        connectingPath.moveTo(x, y);
                    } else {
                        connectingPath.lineTo(x, y);
                    }
                
                    ctx.beginPath();
                    ctx.ellipse(x, y, 10, 10, 0, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.closePath();
                }
                connectingPath.lineTo(this.vertices[0].x, this.vertices[0].y);
                ctx.stroke(connectingPath);
                ctx.closePath(connectingPath);
            }
            
            // Вызываем callback отрисовки, если он существует
            if (this.drawnCallback) this.drawnCallback();
            // Сбрасываем флаг перерисовки холста
            this.dirty = false;
        }
        // Продолжаем цикл отрисовки
        requestAnimationFrame(this.draw);
    }
}