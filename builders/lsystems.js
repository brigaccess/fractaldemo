class LSystem {
    constructor(canvas, offset, initial, rules, drawRules, angle, lengthFun) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.states = [initial];   // Массив состояний строки для каждой итерации
        this.dirty = false;        // Флаг обновления холста

        this.iteration = 0;   // Текущая итерация
        this.drawnState = {}; // Словарь отрисованных состояний

        this.angle = angle;   // Угол поворота, в радианах
        this.rules = rules;   // Словарь правил преобразования символов при итерации
        this.drawRules = drawRules; // Словарь правил преобразования символов при отрисовке
        this.lengthFun = lengthFun ? lengthFun : this.defaultLengthFun; // Функция определения длины шага
        
        this.defaultRotation = offset.length == 3 ? offset[2] : Math.PI / 2;    // Направление по умолчанию
        this.rotation = this.defaultRotation;  // Текущее направление
        this.offset = offset;                  // Массив смещений по осям (x, y)

        // Привязываем методы к классу
        this.defaultLengthFun = this.defaultLengthFun.bind(this);
        this.draw = this.draw.bind(this);
        this.lengthFun = this.lengthFun.bind(this);
        this.lineDraw = this.lineDraw.bind(this);
        this.nextIteration = this.nextIteration.bind(this);
        this.prevIteration = this.prevIteration.bind(this);
        this.rotate = this.rotate.bind(this);
        // Запускаем цикл отрисовки
        requestAnimationFrame(this.draw);
    }

    defaultLengthFun() {
        // Функция определения длины по умолчанию. Возвращает 10. Взято с потолка.
        return 10;
    }

    nextIteration() {
        // Проверяем, не построена ли эта итерация
        if (this.iteration == this.states.length - 1) {
            var prevState = this.states[this.iteration];
            // Засекаем время итерации
            var startTime = performance.now();
            var result = '';
            // Для каждого символа в предыдущем состоянии
            for (var i = 0; i < prevState.length; i++) {
                // Если правило для преобразования символа задано
                if (this.rules[prevState[i]]) {
                    // Добавляем к результату преобразованный символ
                    result = result + this.rules[prevState[i]];
                } else {
                    // Добавляем к результату исходный символ
                    result = result + prevState[i];
                }
            }
            // Итерация завершена, фиксируем время
            this.iterationTime = performance.now() - startTime;
            // Добавляем результат в массив состояний
            this.states.push(result);
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

    // Меняет направление на заданный угол по/против часовой стрелки
    rotate(clockwise) {
        this.rotation = this.rotation + (this.angle * (clockwise ? -1 : 1));
    }

    // Отрисовывает линию с длиной length
    lineDraw(length) {
        var ctx = this.ctx;
        
        ctx.beginPath();
        ctx.moveTo(this.turtleX, this.turtleY);
        var deltaX = Math.sin(this.rotation) * length;
        var deltaY = Math.cos(this.rotation) * length;

        ctx.lineTo(this.turtleX + deltaX, this.turtleY + deltaY);
        this.turtleX += deltaX;
        this.turtleY += deltaY;
        ctx.stroke();

        this.dirty = true;
    }

    // Отрисовывает состояние из строки state
    drawState(state) {
        var statesStack = [];   // Стек состояний
        // Координаты "черепашки"
        this.turtleX = this.offset[0];
        this.turtleY = this.offset[1];
        // Поворот "черепашки"
        this.rotation = this.defaultRotation;

        // Для каждого символа
        for (var i = 0; i < state.length; i++) {
            // Если для текущего символа есть правило преобразования при отрисовке, применить его
            var c = this.drawRules[state[i]] ? this.drawRules[state[i]] : state[i];
            // Выбор действия в зависимости от символа
            switch (c) {
                case 'F':
                    this.lineDraw(this.lengthFun());
                    break;
                case '+':
                    this.rotate();
                    break;
                case '-':
                    this.rotate(true);
                    break;
                case '[' :
                    // Сохранение состояния в стеке состояний
                    var newPos = {x: this.turtleX, y: this.turtleY, rot: this.rotation};
                    statesStack.push(newPos);
                    break;
                case ']':
                    // Извлечение состояния из стека состояний
                    var index = statesStack.length - 1;
                    var pos = statesStack[index];
                    this.turtleX = pos.x;
                    this.turtleY = pos.y;
                    this.rotation = pos.rot;
                    statesStack.splice(index, 1);
                    break;
                default:
                    // Неизвестные символы пропускаются
                    break;
            }
        }
    }
    
    draw() {
        if (this.dirty) {
            var ctx = this.ctx;
            // Очищаем холст
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            // Засекаем время отрисовки
            var startTime = performance.now()
            // Если состояние не отрисовано
            if (!this.drawnState[this.iteration]) {
                // Отрисовать состояние и сохранить его
                this.drawState(this.states[this.iteration]);
                this.drawnState[this.iteration] = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            } else {
                // Поместить на холст уже отрисованное состояние
                ctx.putImageData(this.drawnState[this.iteration], 0, 0);
            }
            // Фиксируем время отрисовки
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
 

