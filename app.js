class BeamInfluenceLineApp {
    constructor() {
        this.canvas = document.getElementById('beamCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Beam properties
        this.spans = 0;
        this.supports = [];
        this.xSupport = [];
        this.labels = ['A', 'B', 'C', 'D'];
        this.sectionForceType = ['reaction force', 'shear force', 'moment'];
        
        // Check properties
        this.sctCheck = 0;
        this.sctFrcCheck = 0;
        this.vSide = 0;
        this.infI = [];
        this.infPlot = false;
        
        // Drawing parameters
        this.scale = 300; // pixels per unit
        this.offsetX = this.canvas.width / 2;
        this.offsetY = this.canvas.height / 2;
        
        // Bind buttons
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
    
    // Random generation methods
    randomSpans() {
        this.spans = Math.floor(Math.random() * 3) + 1; // 1-3 spans
        this.xSupport = [];
        for (let i = 0; i <= this.spans; i++) {
            this.xSupport.push(-1 + (2 / this.spans) * i);
        }
    }
    
    randomSupports() {
        let check = false;
        while (!check) {
            const stype = new Array(this.spans + 1).fill(0);
            stype[0] = Math.floor(Math.random() * 3) + 1; // 1-3
            stype[stype.length - 1] = Math.floor(Math.random() * 3) + 1;
            
            if (this.spans > 1) {
                for (let i = 1; i < stype.length - 1; i++) {
                    stype[i] = Math.floor(Math.random() * 2) + 1; // 1-2
                }
            }
            
            this.supports = stype;
            
            // Check validity
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
            
            if (support === 1) { // free support
                if (this.sctCheck === 0 || this.sctCheck === this.spans) {
                    check = false;
                } else {
                    this.sctFrcCheck = Math.floor(Math.random() * 2) + 1; // 1-2 (shear or moment)
                    check = true;
                }
            } else if (support === 2) { // triangular
                if (this.sctCheck === 0 || this.sctCheck === this.spans) {
                    this.sctFrcCheck = 0; // reaction
                    check = true;
                } else {
                    this.sctFrcCheck = Math.floor(Math.random() * 3); // 0-2
                    if (this.sctFrcCheck === 1) { // shear
                        this.vSide = Math.floor(Math.random() * 2); // 0-1
                    }
                    check = true;
                }
            } else { // fixed
                this.sctFrcCheck = Math.floor(Math.random() * 3);
                check = true;
            }
        }
    }
    
    // Drawing methods
    toCanvasX(x) {
        return this.offsetX + x * this.scale;
    }
    
    toCanvasY(y) {
        return this.offsetY - y * this.scale;
    }
    
    plotBeam(showInfluence = false) {
        this.clearCanvas();
        
        const sf = showInfluence ? this.getScaleFactor() : 1;
        
        // Draw beam outline
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
        
        // Draw supports
        for (let i = 0; i < this.supports.length; i++) {
            this.drawSupport(i, sf);
        }
        
        // Draw labels
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
        
        // Draw influence line if needed
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
        
        if (support === 2) { // triangular
            this.ctx.beginPath();
            this.ctx.moveTo(this.toCanvasX(x), this.toCanvasY(-0.1 * sf));
            this.ctx.lineTo(this.toCanvasX(x + 0.025), this.toCanvasY(-0.2 * sf));
            this.ctx.lineTo(this.toCanvasX(x - 0.025), this.toCanvasY(-0.2 * sf));
            this.ctx.closePath();
            this.ctx.stroke();
        } else if (support === 3) { // fixed
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
        return Math.ceil(maxVal * 10) / 10 / 2;
    }
    
    drawInfluenceLine() {
        // Draw zero line
        this.ctx.strokeStyle = 'blue';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.toCanvasX(-1), this.toCanvasY(0));
        this.ctx.lineTo(this.toCanvasX(1), this.toCanvasY(0));
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw influence line
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
        
        // Draw grid
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.xSupport.length; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.toCanvasX(this.xSupport[i]), 0);
            this.ctx.lineTo(this.toCanvasX(this.xSupport[i]), this.canvas.height);
            this.ctx.stroke();
        }
    }
    
    // Calculation methods (simplified)
    calculateInfluenceLine() {
        // Simplified calculation - creates linear
