var quaterLine = 'rgba(0, 0, 0, 0.05)';
var halfLine = 'rgba(0, 0, 0, 0.1)';
var fullLine = 'rgba(0, 0, 0, 0.2)';

function setLineColor(ctx, i) {
    if (i % 100 == 0) {
        ctx.strokeStyle = fullLine;
    } else if (i % 100 == 50) {
        ctx.strokeStyle = halfLine;
    } else {
        ctx.strokeStyle = quaterLine;
    }
}

window.makeGrid = function(canvas) {
    let ctx = canvas.getContext('2d');
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = 0.3;
    for (let i = canvas.width; i >= 0; i -= 25) {
        setLineColor(ctx, i);
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = canvas.height; i >= 0; i -= 25) {
        setLineColor(ctx, i);
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
}