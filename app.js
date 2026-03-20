class BeamInfluenceLineApp {
    constructor() {
        this.canvas = document.getElementById('beamCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.spans = 0;
        this.supports = [];
        this.xSupport = [];
        this.labels = ['A', 'B', 'C', 'D'];
        this.sectionForceType = ['reaction force', 'shear force', 'moment'];
        
        this.sctCheck = 0;
        this.sctFrcCheck = 0;
        this.vSide = 0;
        this.infI = [];
        this.infPlot = false;
        
        this.scale = 300;
        this.offsetX = this.canvas.width / 2;
        this.offsetY = this.canvas.height / 2;
        
        document.getElementById('goButton').addEventListener('click', () => this.goButtonPushed());
        document.getElementById('solutionButton').addEventListener('click', () => this.solutionButtonPushed());
        document.getElementById('resetButton').addEventListener('click', () => this.resetButtonPushed());
        
        this.init();
    }
    
    init() {
        this.clearCanvas();
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    randomSpans() {
        this.spans = Math.floor(Math.random() * 3) + 1;
        this.xSupport = [];
        for (let i = 0; i <= this.spans; i++) {
            this.xSupport.push(-1 + (2 / this.spans) * i);
        }
    }
    
    randomSupports() {
        let check = false;
        while (!check) {
            const stype = new Array(this.spans + 1).fill(0);
            stype[0] = Math.floor(Math.random() * 3) + 1;
            stype[stype.length - 1] = Math.floor(Math.random() * 3) + 1;
            
            if (this.spans > 1) {
                for (let i = 1; i < stype.length - 1; i++) {
                    stype[i] = Math.floor(Math.random() * 2) + 1;
                }
            }
            
            this.supports = stype;
            
            const hasFixed = stype.includes(3);
            const triangCount = stype.filter(s => s === 2).length;
            
            if (!hasFixed && triangCount >= 2) {
                check = true;
            } else if (hasFixed) {
                check = true;
            }
        }
    }
    
    randomSectionForce() {
        let check = false;
        while (!check) {
            this.sctCheck = Math.floor(Math.random() * (this.spans + 1));
            const support = this.supports[this.sctCheck];
            
            if (support === 1) {
                if (this.sctCheck === 0 || this.sctCheck === this.spans) {
                    check = false;
                } else {
                    this.sctFrcCheck = Math.floor(Math.random() * 2) + 1;
                    check = true;
                }
            } else if (support === 2) {
                if (this.sctCheck === 0 || this.sctCheck === this.spans) {
                    this.sctFrcCheck = 0;
                    check = true;
                } else {
                    this.sctFrcCheck = Math.floor(Math.random() * 3);
                    if (this.sctFrcCheck === 1) {
                        this.vSide = Math.floor(Math.random() * 2);
                    }
                    check = true;
                }
            } else {
                this.sctFrcCheck = Math.floor(Math.random() * 3);
                check = true;
            }
        }
    }
    
    toCanvasX(x) {
        return this.offsetX + x * this.scale;
    }
    
    toCanvasY(y) {
        return this.offsetY - y * this.scale;
    }
    
    plotBeam(showInfluence = false) {
        this.clearCanvas();
        
        const sf = showInfluence ? this.getScaleFactor() : 1;
        
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.rect(
            this.toCanvasX(-1),
            this.toCanvasY(0.1 * sf),
            this.scale * 2,
            this.scale * 0.2 * sf
        );
        this.ctx.stroke();
        
        for (let i = 0; i < this.supports.length; i++) {
            this.drawSupport(i, sf);
        }
        
        this.ctx.fillStyle = 'black';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        for (let i = 0; i < this.supports.length; i++) {
            this.ctx.fillText(
                this.labels[i],
                this.toCanvasX(this.xSupport[i]),
                this.toCanvasY(-0.31 * sf) + 5
            );
        }
        
        if (showInfluence && this.infI.length > 0) {
            this.drawInfluenceLine();
        }
    }
    
    drawSupport(index, sf) {
        const x = this.xSupport[index];
        const support = this.supports[index];
        
        this.ctx.strokeStyle = 'black';
        this.ctx.fillStyle = 'black';
        this.ctx.lineWidth = 2;
        
        if (support === 2) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.toCanvasX(x), this.toCanvasY(-0.1 * sf));
            this.ctx.lineTo(this.toCanvasX(x + 0.025), this.toCanvasY(-0.2 * sf));
            this.ctx.lineTo(this.toCanvasX(x - 0.025), this.toCanvasY(-0.2 * sf));
            this.ctx.closePath();
            this.ctx.stroke();
        } else if (support === 3) {
            const dir = index === 0 ? 1 : -1;
            this.ctx.beginPath();
            this.ctx.moveTo(this.toCanvasX(x), this.toCanvasY(-0.1 * sf));
            this.ctx.lineTo(this.toCanvasX(x + dir * 0.025), this.toCanvasY(0 * sf));
            this.ctx.lineTo(this.toCanvasX(x + dir * 0.025), this.toCanvasY(0.2 * sf));
            this.ctx.lineTo(this.toCanvasX(x), this.toCanvasY(0.2 * sf));
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }
    
    getScaleFactor() {
        if (this.infI.length === 0) return 1;
        const maxVal = Math.max(...this.infI.map(p => Math.abs(p.y)));
        return Math.max(0.5, Math.ceil(maxVal * 10) / 10 / 2);
    }
    
    drawInfluenceLine() {
        this.ctx.strokeStyle = 'blue';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.toCanvasX(-1), this.toCanvasY(0));
        this.ctx.lineTo(this.toCanvasX(1), this.toCanvasY(0));
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        for (let i = 0; i < this.infI.length; i++) {
            const x = this.toCanvasX(this.infI[i].x);
            const y = this.toCanvasY(this.infI[i].y);
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.stroke();
        
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.xSupport.length; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.toCanvasX(this.xSupport[i]), 0);
            this.ctx.lineTo(this.toCanvasX(this.xSupport[i]), this.canvas.height);
            this.ctx.stroke();
        }
    }
    
    calculateInfluenceLine() {
        this.infI = [];
        const numPoints = 100;
        
        const checkX = this.xSupport[this.sctCheck];
        
        // Simplified influence line calculation
        for (let i = 0; i < numPoints; i++) {
            const x = -1 + (2 * i) / (numPoints - 1);
            let y = 0;
            
            if (this.sctFrcCheck === 0) { // Reaction force
                if (this.spans === 1) {
                    y = x <= checkX ? (x + 1) / 2 : (1 - x) / 2;
                } else {
                    const spanLength = 2 / this.spans;
                    const relPos = (checkX + 1) /