class KochSnowflake {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dirty = true;
        this.lines = [];
        this.iteration = 0;
        
        this.vertices = 3;
        this.parts = 3;
        this.nextSegment = 2;

        this.draw = this.draw.bind(this);
        this.initializeLines = this.initializeLines.bind(this);
        this.splitLines = this.nextIteration.bind(this);

        this.initializeLines();
        this.nextIteration();
        this.nextIteration();
        this.nextIteration();
        requestAnimationFrame(this.draw);
    }

    /* Initializes a fractal */
    initializeLines() {
        // Pick a center point and radius
        let centerX = this.canvas.width / 2;
        let centerY = this.canvas.height / 2;
        let radius = Math.min(centerX, centerY) - 10;

        let segment = (2 * Math.PI) / this.vertices;
        let pos = segment;
        for (let i = 0; i < this.vertices; i++) {
            let pointX = centerX + radius * Math.sin(pos);
            let pointY = centerY + radius * Math.cos(pos);
            this.lines.push({x: pointX, y: pointY});
            pos += segment;
        }
        this.dirty = true;
    }

    /* Iterates the fractal */
    nextIteration() {
        if (this.iteration > 7) {
            // TODO Alert "Are you sure?"
            return;
        }
        let length = this.lines.length;
        let newLines = [];
        /* 
                Step 0: increase iteration counter
        */
        this.iteration++;
        for (let i = 0; i < length; i++) {
            // Save points for convenience
            let currentPt = this.lines[i];
            let nextPt = this.lines[(i + 1) % length];
            
            // Deltas for further computations
            let deltaX = nextPt.x - currentPt.x;
            let deltaY = nextPt.y - currentPt.y;
            // Segment deltas for line partitioning
            let segX = deltaX / this.parts;
            let segY = deltaY / this.parts;
            // Multiplier for proper placement of new points
            let mulX = deltaX > 0 ? 1 : -1;
            let mulY = deltaY > 0 ? 1 : -1;

            /*
                Step 1: add previous point
            */
            newLines.push(currentPt);
            
            /*
                Step 2: add a new point at 1/this.parts of current line
            */
            newLines.push({
                x: currentPt.x + segX,
                y: currentPt.y + segY,
                gen: this.iteration
            });
            
            /*
                Step 3: calculate the coordinates for a new point
            */
            // Hypotenuse of a right-angled triangle with vertices (currentPt, nextPt)
            let hypotenuse = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            // Distance from current line to a new point
            let distance = Math.sqrt(Math.pow(hypotenuse / this.parts, 2) - Math.pow(hypotenuse / (this.parts * 2), 2));

            // Determine angle of the square triangle (currentPt, nextPt)
            let tsin = Math.abs(deltaX) / hypotenuse;

            /*
                The idea is to use basic trigonometry: we know catheti lengths,
                we know hypotenuse length, so we can determine the angle at currentPt.

                Then we know that the point we're searching for is a vertex of 
                another right-angled triangle. We know its catheti lengths 
                (hypotenuse / 2, distance) so we can find its angles.

                This vertex belongs to two right-angled triangles. The first one is known
                -- it's the one we mentioned earlier. However, the second one -- 
                the one that shares hypotenuse with the first one and 
                has catheti == coordinates of vertex -- is not.

                To find the coordinates of the vertex, under the circumstances, 
                we need to know this second triangle. We already know it's hypotenuse,
                the only thing left to find is at least one angle -- then we can use
                sin and cos to find the sides, which lengths == coordinates of vertex.
            */
            let smallHypotenuse = Math.sqrt(Math.pow(hypotenuse / 2, 2) + Math.pow(distance, 2));

            // Rotation fix
            let invert = ((deltaX > 0 && deltaY <= 0) || (deltaX <= 0 && deltaY > 0)) ? -1 : 1;
            let angle = Math.asin(tsin) - Math.asin(distance / smallHypotenuse) * invert;
            
            // Finally, coordinates of the vertex
            let centerX = currentPt.x + smallHypotenuse * Math.sin(angle) * mulX;
            let centerY = currentPt.y + smallHypotenuse * Math.cos(angle) * mulY;

            newLines.push({
                x: centerX,
                y: centerY,
                gen: this.iteration
            });
           
            /*
                Step 4: add a new point at (this.parts - 1)/this.parts 
            */
            newLines.push({
                x: currentPt.x + segX * this.nextSegment,
                y: currentPt.y + segY * this.nextSegment,
                gen: this.iteration
            });
        }
        this.lines = newLines;
        this.dirty = true;
    }

    /* Removes all the vertices with generation > current generation */
    prevIteration() {
        if (this.iteration == 0) {
            return;
        }
        
        this.iteration--;
        let newLines = [];
        for (let i = 0; i < this.lines.length; i++) {
            if (this.lines[i].gen == undefined || this.lines[i].gen <= this.iteration) {
                newLines.push(this.lines[i]);
            }
        }
        this.lines = newLines;
        this.dirty = true;
    }

    /* Draw loop */
    draw() {
        if (this.dirty) {
            let colors = ['red', 'green', 'blue'];
            let ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            for (let i = 1; i <= this.lines.length; i++) {
                ctx.beginPath();
                ctx.moveTo(this.lines[i - 1].x, this.lines[i - 1].y);
                let point = this.lines[i % this.lines.length];
                ctx.lineTo(point.x, point.y);
                ctx.strokeStyle = colors[(i - 1) % 3];
                ctx.stroke();
                ctx.closePath();
            }

            this.dirty = false;
        }
        requestAnimationFrame(this.draw);
    }
}