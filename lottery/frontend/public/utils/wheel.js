// 转盘抽奖工具

class LotteryWheel {
    constructor(canvasId, prizes) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.prizes = prizes;
        this.rotation = 0;
        this.isSpinning = false;
        this.colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#F1948A'
        ];
        
        this.draw();
    }
    
    draw() {
        const { width, height } = this.canvas;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 10;
        const sliceAngle = (2 * Math.PI) / this.prizes.length;
        
        this.ctx.clearRect(0, 0, width, height);
        
        // 绘制转盘扇形
        for (let i = 0; i < this.prizes.length; i++) {
            const startAngle = this.rotation + i * sliceAngle;
            const endAngle = startAngle + sliceAngle;
            
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            
            this.ctx.fillStyle = this.colors[i % this.colors.length];
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 绘制文字
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle + sliceAngle / 2);
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText(this.prizes[i].name, radius - 20, 5);
            this.ctx.restore();
        }
        
        // 绘制中心圆
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // 绘制指针
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + radius + 10, centerY);
        this.ctx.lineTo(centerX + radius - 20, centerY - 15);
        this.ctx.lineTo(centerX + radius - 20, centerY + 15);
        this.ctx.closePath();
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fill();
    }
    
    spin() {
        return new Promise((resolve) => {
            if (this.isSpinning) return;
            
            this.isSpinning = true;
            let speed = 20 + Math.random() * 10;
            let deceleration = 0.99;
            let minSpeed = 0.1;
            
            const animate = () => {
                speed *= deceleration;
                this.rotation += speed * Math.PI / 180;
                
                if (speed < minSpeed) {
                    this.isSpinning = false;
                    const result = this.getResult();
                    resolve(result);
                } else {
                    this.draw();
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        });
    }
    
    getResult() {
        const normalizedRotation = this.rotation % (2 * Math.PI);
        const sliceAngle = (2 * Math.PI) / this.prizes.length;
        const pointerAngle = (2 * Math.PI - normalizedRotation) % (2 * Math.PI);
        const index = Math.floor(pointerAngle / sliceAngle);
        return this.prizes[index % this.prizes.length];
    }
}

// 创建转盘实例的辅助函数
function createWheel(canvasId, prizes) {
    return new LotteryWheel(canvasId, prizes);
}
