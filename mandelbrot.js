class MandelbrotSet {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        
        this.centerX = -0.6;
        this.centerY = 0;
        
        this.logBase = 1.0 / Math.log(2.0);
        this.logHalfBase = Math.log(0.5)*this.logBase;

        this.escapeRadius = 10;
        this.iterations = 100;
        this.ratio = (this.canvas.width / this.canvas.height);

        this.drawLine = this.drawLine.bind(this);
        this.drawFrame = this.drawFrame.bind(this);
        this.draw = this.draw.bind(this);
        this.updateZoom = this.updateZoom.bind(this);
        this.registerEvents = this.registerEvents.bind(this);
        
        this.touchStart = this.touchStart.bind(this);
        this.touchMove = this.touchMove.bind(this);
        this.touchEnd = this.touchEnd.bind(this);

        this.touchStatus = false;

        this.registerEvents();

        this.updateZoom(1);
        this.dirty = true;
        requestAnimationFrame(this.draw);
    }

    updateZoom(zoom) {
        if (Number.isFinite(zoom)) {
            this.zoomX = zoom * 2 * this.ratio / this.canvas.width;
            this.zoomY = zoom * 2 / this.canvas.height;
            this.dirty = true;
        }
    }

    touchStart(e) {
        this.touchStatus = true;
        let touch;

        if (e.touches && e.touches.length == 1) {
            touch = e.touches[0];
        } else if (e.touches && e.touches.length > 1) {
            // Zoom;
            return;
        }
        else if (!e.touches) {
            touch = e;
        }

        this.touchX = touch.clientX;
        this.touchY = touch.clientY;
    }

    touchMove(e) {
        if (this.touchStatus) {
            let touch;

            if (e.touches && e.touches.length == 1) {
                touch = e.touches[0];
            } else if (!e.touches) {
                touch = e;
            }

            let dx = (touch.clientX - this.touchX) * this.zoomX;
            let dy = (touch.clientY - this.touchY) * this.zoomY;

            this.centerX -= dx;
            this.centerY -= dy;
            this.touchX = touch.clientX;
            this.touchY = touch.clientY;
            this.dirty = true;
        }
    }

    touchEnd(e) {   
        this.touchStatus = false;
    }

    registerEvents(canvas) {
        this.canvas.addEventListener('mousedown', this.touchStart);
        this.canvas.addEventListener('mousemove', this.touchMove);
        this.canvas.addEventListener('mouseup', this.touchEnd);
        this.canvas.addEventListener('touchstart', this.touchStart);
        this.canvas.addEventListener('touchmove', this.touchMove);
        this.canvas.addEventListener('touchend', this.touchEnd);
    }

    calculatePoint(x, y, escapeRadius, iters) {
        let n = 0;
        let overN = 0;
        let ZReal = 0;
        let ZImg = 0;
        let squaredZReal = 0;
        let squaredZImg = 0;
        let inEscape = true;

        while (n < iters && overN < 4) {
            n++;
            // For those who don't know math:
            // Imaginary part should be calculated first! 
            ZImg = ZReal * ZImg * 2 + y;
            ZReal = squaredZReal - squaredZImg + x;

            squaredZReal = ZReal * ZReal;
            squaredZImg = ZImg * ZImg;
            
            inEscape = (squaredZReal + squaredZImg) < escapeRadius;
            if (!inEscape) overN++;
        }
        return [n, squaredZReal, squaredZImg];
    }

    getColor(steps, n, squaredR, squaredI)
    {
        if ( n == steps ) return [0, 0, 0, 255];

        var v = (2 + n - Math.log(Math.log(Math.sqrt(squaredR+squaredI)))/Math.log(2.0));
        v = Math.floor(512.0 * v/steps);
        var rgv = Math.max(Math.min(v - 100, 255), 0);
        
        return [rgv, rgv, Math.min(v, 255), 255];
    }


    drawLine(img, y, offset, width, startx, stepx) {
        let x = startx;
        for (let i = 0; i < width; i++) {
            var pt = this.calculatePoint(x, y, this.escapeRadius, this.iterations);
            var color = this.getColor(this.iterations, pt[0], pt[1], pt[2])
            img.data[offset++] = color[0];
            img.data[offset++] = color[1];
            img.data[offset++] = color[2];
            img.data[offset++] = color[3];
            x += stepx;
        }
    }

    drawFrame() {
        let newFrame = new ImageData(this.canvas.width, this.canvas.height);
        let deltaX = this.canvas.width * this.zoomX;
        let deltaY = this.canvas.height * this.zoomY;
        let CImg = this.centerY - (deltaY / 2);
        let CReal = this.centerX - (deltaX / 2);
        for (let i = 0; i < this.canvas.height; i++) {
            this.drawLine(newFrame, CImg + i * deltaY / this.canvas.height, i * this.canvas.width * 4, this.canvas.width, CReal, deltaX / this.canvas.width);
        }
    
        return newFrame;
    }

    draw() {
        if (this.dirty) {
            let start = performance.now();
            let newFrame = this.drawFrame();
            let end = Math.round(performance.now() - start);

            this.ctx.putImageData(newFrame, 0, 0);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px monospace';
            this.ctx.fillText('FPS: ' + Math.round(1000 / end) + ' Время кадра: ' + end + 'ms', 0, 10);
            this.dirty = false;
        }
        requestAnimationFrame(this.draw);
    }
}