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
        this.ctx.fillStyle = 'black';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Click GO! to generate a random beam', this.canvas.width / 2, this.canvas.height / 2);
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
        
        // Draw beam outline
        this.ctx.strokeStyle = 'black';
        this.ctx.fillStyle = '#d3d3d3';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(
            this.toCanvasX(-1),
            this.toCanvasY(0.1 * sf),
            this.scale * 2,
            this.scale * 0.2 * sf
        );
        this.ctx.strokeRect(
            this.toCanvasX(-1),
            this.toCanvasY(0.1 * sf),
            this.scale * 2,
            this.scale * 0.2 * sf
        );
        
        // Draw supports
        for (let i = 0; i < this.supports.length; i++) {
            this.drawSupport(i, sf);
        }
        
        // Draw labels
        this.ctx.fillStyle = 'black';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        for (let i = 0; i < this.supports.length; i++) {
            this.ctx.fillText(
                this.labels[i],
                this.toCanvasX(this.xSupport[i]),
                this.toCanvasY(-0.35 * sf)
            );
        }
        
        if (showInfluence && this.infI.length > 0) {
            this.drawInfluenceLine();
            this.drawTitle();
        }
    }
    
    drawSupport(index, sf) {
        const x = this.xSupport[index];
        const support = this.supports[index];
        
        this.ctx.strokeStyle = 'black';
        this.ctx.fillStyle = 'white';
        this.ctx.lineWidth = 2;
        
        if (support === 2) { // Triangular support
            this.ctx.beginPath();
            this.ctx.moveTo(this.toCanvasX(x), this.toCanvasY(-0.1 * sf));
            this.ctx.lineTo(this.toCanvasX(x + 0.05), this.toCanvasY(-0.25 * sf));
            this.ctx.lineTo(this.toCanvasX(x - 0.05), this.toCanvasY(-0.25 * sf));
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            
            // Draw hatching below
            this.ctx.beginPath();
            this.ctx.moveTo(this.toCanvasX(x - 0.06), this.toCanvasY(-0.25 * sf));
            this.ctx.lineTo(this.toCanvasX(x + 0.06), this.toCanvasY(-0.25 * sf));
            this.ctx.stroke();
            
            for (let i = -3; i <= 3; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(this.toCanvasX(x + i * 0.02), this.toCanvasY(-0.25 * sf));
                this.ctx.lineTo(this.toCanvasX(x + i * 0.02 - 0.01), this.toCanvasY(-0.3 * sf));
                this.ctx.stroke();
            }
            
        } else if (support === 3) { // Fixed support
            const dir = index === 0 ? 1 : -1;
            
            this.ctx.fillStyle = '#cccccc';
            this.ctx.fillRect(
                this.toCanvasX(x),
                this.toCanvasY(0.2 * sf),
                dir * 0.05 * this.scale,
                0.3 * sf * this.scale
            );
            this.ctx.strokeRect(
                this.toCanvasX(x),
                this.toCanvasY(0.2 * sf),
                dir * 0.05 * this.scale,
                0.3 * sf * this.scale
            );
            
            // Draw hatching
            for (let i = 0; i <= 6; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(
                    this.toCanvasX(x + dir * 0.05),
                    this.toCanvasY(0.2 * sf - i * 0.05 * sf)
                );
                this.ctx.lineTo(
                    this.toCanvasX(x + dir * 0.07),
                    this.toCanvasY(0.2 * sf - i * 0.05 * sf - 0.02 * sf)
                );
                this.ctx.stroke();
            }
        }
    }
    
    getScaleFactor() {
        if (this.infI.length === 0) return 1;
        const maxVal = Math.max(...this.infI.map(p => Math.abs(p.y)));
        return Math.max(0.5, maxVal / 2);
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
        this.ctx.lineWidth = 3;
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
        this.ctx.strokeStyle = '#dddddd';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.xSupport.length; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.toCanvasX(this.xSupport[i]), 0);
            this.ctx.lineTo(this.toCanvasX(this.xSupport[i]), this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal grid lines
        const sf = this.getScaleFactor();
        for (let i = -2; i <= 2; i++) {
            if (i !== 0) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, this.toCanvasY(i * sf / 2));
                this.ctx.lineTo(this.canvas.width, this.toCanvasY(i * sf / 2));
                this.ctx.stroke();
            }
        }
    }
    
    drawTitle() {
        this.ctx.fillStyle = 'black';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        
        let title = 'Influence line for ' + this.sectionForceType[this.sctFrcCheck] + 
                    ' in section ' + this.labels[this.sctCheck];
        
        if (this.sctCheck !== 0 && this.sctCheck !== this.spans && 
            this.supports[this.sctCheck] === 2 && this.sctFrcCheck === 1) {
            title += this.vSide === 0 ? ' (left side)' : ' (right side)';
        }
        
        this.ctx.fillText(title, this.canvas.width / 2, 30);
    }
    
    calculateInfluenceLine() {
        this.infI = [];
        const numPoints = 200;
        const checkX = this.xSupport[this.sctCheck];
        
        // Simplified influence line calculation using basic structural analysis
        for (let i = 0; i < numPoints; i++) {
            const x = -1 + (2 * i) / (numPoints - 1);
            let y = 0;
            
            // Simple calculation based on type
            if (this.sctFrcCheck === 0) { // Reaction force
                y = this.calculateReactionInfluence(x, checkX);
            } else if (this.sctFrcCheck === 1) { // Shear force
                y = this.calculateShearInfluence(x, checkX);
            } else { // Moment
                y = this.calculateMomentInfluence(x, checkX);
            }
            
            this.infI.push({x: x, y: y});
        }
    }
    
    calculateReactionInfluence(x, checkX) {
        const L = 2; // Total beam length
        const a = checkX + 1; // Distance from left end
        const b = L - a; // Distance from right end
        
        if (this.spans === 1) {
            // Simple beam
            if (this.sctCheck === 0) {
                return x <= 1 ? (1 - x) / 2 : 0;
            } else {
                return x >= -1 ? (x + 1) / 2 : 0;
            }
        } else {
            // Continuous beam - simplified
            const spanLength = 2 / this.spans;
            const spanIndex = Math.floor((checkX + 1) / spanLength);
            const localX = (x + 1) / spanLength;
            const localCheck = (checkX + 1) / spanLength;
            
            if (localX >= spanIndex && localX <= spanIndex + 1) {
                if (this.sctCheck === spanIndex) {
                    return 1 - (localX - spanIndex);
                } else {
                    return localX - spanIndex;
                }
            }
            return 0;
        }
    }
    
    calculateShearInfluence(x, checkX) {
        const spanLength = 2 / this.spans;
        const tolerance = 0.001;
        
        if (this.spans === 1) {
            // Simple beam
            if (Math.abs(x - checkX) < tolerance) {
                return this.vSide === 0 ? -0.5 : 0.5;
            }
            if (x < checkX) {
                return -0.5;
            } else {
                return 0.5;
            }
        } else {
            // Continuous beam - shear at intermediate support
            if (this.sctCheck === 0 || this.sctCheck === this.spans) {
                // End support
                if (x < checkX) {
                    return (x + 1) / 2 - 1;
                } else {
                    return (x + 1) / 2;
                }
            } else {
                // Intermediate support
                const leftSpanStart = this.xSupport[this.sctCheck - 1];
                const rightSpanEnd = this.xSupport[this.sctCheck + 1];
                
                if (this.vSide === 0) {
                    // Left side of support
                    if (x < leftSpanStart) {
                        return 0;
                    } else if (x >= leftSpanStart && x < checkX) {
                        return -(checkX - x) / spanLength;
                    } else if (Math.abs(x - checkX) < tolerance) {
                        return -1;
                    } else {
                        return 0;
                    }
                } else {
                    // Right side of support
                    if (x < checkX) {
                        return 0;
                    } else if (Math.abs(x - checkX) < tolerance) {
                        return 1;
                    } else if (x > checkX && x <= rightSpanEnd) {
                        return (x - checkX) / spanLength;
                    } else {
                        return 0;
                    }
                }
            }
        }
    }
    
    calculateMomentInfluence(x, checkX) {
        const L = 2;
        const spanLength = 2 / this.spans;
        
        if (this.spans === 1) {
            // Simple beam
            const a = checkX + 1; // Distance from left support to check point
            const b = L - a; // Distance from check point to right support
            
            if (x <= -1) {
                return 0;
            } else if (x > -1 && x < checkX) {
                return (x + 1) * b / L;
            } else if (x >= checkX && x < 1) {
                return (1 - x) * a / L;
            } else {
                return 0;
            }
        } else {
            // Continuous beam
            const supportIndex = this.sctCheck;
            
            // Determine which span the check point is in
            let spanIndex = 0;
            for (let i = 0; i < this.spans; i++) {
                if (checkX >= this.xSupport[i] && checkX <= this.xSupport[i + 1]) {
                    spanIndex = i;
                    break;
                }
            }
            
            const spanStart = this.xSupport[spanIndex];
            const spanEnd = this.xSupport[spanIndex + 1];
            const localCheckX = checkX - spanStart;
            const localSpanLength = spanEnd - spanStart;
            
            // Simplified moment influence for continuous beam
            if (x < spanStart) {
                return 0;
            } else if (x >= spanStart && x < checkX) {
                const localX = x - spanStart;
                const a = localCheckX;
                const b = localSpanLength - a;
                return localX * b / localSpanLength;
            } else if (x >= checkX && x <= spanEnd) {
                const localX = x - spanStart;
                const a = localCheckX;
                const b = localSpanLength - a;
                return (localSpanLength - localX) * a / localSpanLength;
            } else {
                return 0;
            }
        }
    }
    
    updateInfluenceText() {
        const textElement = document.getElementById('influenceText');
        let text = 'Sketch influence line for ' + 
                   this.sectionForceType[this.sctFrcCheck] + 
                   ' in section ' + this.labels[this.sctCheck];
        
        if (this.sctCheck !== 0 && this.sctCheck !== this.spans && 
            this.supports[this.sctCheck] === 2 && this.sctFrcCheck === 1) {
            text += this.vSide === 0 ? ' (left side)' : ' (right side)';
        }
        
        textElement.textContent = text;
    }
    
    goButtonPushed() {
        this.randomSpans();
        this.randomSupports();
        this.randomSectionForce();
        
        this.plotBeam(false);
        this.updateInfluenceText();
        
        document.getElementById('solutionButton').disabled = false;
        document.getElementById('resetButton').disabled = false;
        
        this.infPlot = false;
        this.infI = [];
    }
    
    solutionButtonPushed() {
        this.calculateInfluenceLine();
        this.infPlot = true;
        this.plotBeam(true);
    }
    
    resetButtonPushed() {
        this.plotBeam(false);
        document.getElementById('influenceText').textContent = '';
        document.getElementById('solutionButton').disabled = true;
        
        this.sctCheck = 0;
        this.sctFrcCheck = 0;
        this.vSide = 0;
        this.infI = [];
        this.infPlot = false;
    }
}

// Initialize the app when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new BeamInfluenceLineApp();
});
