const fs = require('fs');
const path = require('path');

/**
 * Performance Check Script
 * Analyzes bundle sizes, checks for potential memory leaks, and validates optimizations
 */

class PerformanceChecker {
    constructor() {
        this.results = {
            bundleSize: {},
            codeAnalysis: {},
            recommendations: [],
            score: 0
        };
    }

    async checkBundleSize() {
        console.log('📦 Checking bundle sizes...');

        const nextDir = path.join(process.cwd(), '.next');
        if (!fs.existsSync(nextDir)) {
            console.log('❌ .next directory not found. Run "npm run build" first.');
            return;
        }

        const staticDir = path.join(nextDir, 'static');
        if (!fs.existsSync(staticDir)) {
            console.log('❌ Static directory not found.');
            return;
        }

        // Check chunk sizes
        const chunksDir = path.join(staticDir, 'chunks');
        if (fs.existsSync(chunksDir)) {
            const chunks = fs.readdirSync(chunksDir);
            let totalSize = 0;

            chunks.forEach(chunk => {
                const chunkPath = path.join(chunksDir, chunk);
                const stats = fs.statSync(chunkPath);
                const sizeKB = Math.round(stats.size / 1024);
                totalSize += sizeKB;

                if (chunk.endsWith('.js')) {
                    this.results.bundleSize[chunk] = sizeKB;

                    if (sizeKB > 500) {
                        this.results.recommendations.push(`⚠️  Large chunk detected: ${chunk} (${sizeKB}KB)`);
                    }
                }
            });

            this.results.bundleSize.total = totalSize;
            console.log(`📊 Total bundle size: ${totalSize}KB`);

            if (totalSize > 2000) {
                this.results.recommendations.push('🔍 Consider code splitting for bundles over 2MB');
            }
        }
    }

    async analyzeCode() {
        console.log('🔍 Analyzing code for performance issues...');

        const srcDir = path.join(process.cwd(), 'src');
        const issues = [];

        // Check for potential memory leaks
        this.checkForMemoryLeaks(srcDir, issues);

        // Check for infinite loop patterns
        this.checkForInfiniteLoops(srcDir, issues);

        // Check for missing cleanup
        this.checkForMissingCleanup(srcDir, issues);

        this.results.codeAnalysis = {
            totalIssues: issues.length,
            issues: issues
        };

        if (issues.length > 0) {
            console.log(`⚠️  Found ${issues.length} potential performance issues:`);
            issues.forEach(issue => console.log(`   ${issue}`));
        } else {
            console.log('✅ No obvious performance issues detected');
        }
    }

    checkForMemoryLeaks(dir, issues) {
        const files = this.getJSFiles(dir);

        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');

            // Check for missing cleanup in useEffect
            if (content.includes('useEffect') && !content.includes('return () =>')) {
                const relativePath = path.relative(process.cwd(), file);
                issues.push(`Potential memory leak in ${relativePath}: useEffect without cleanup`);
            }

            // Check for event listeners without removal
            if (content.includes('addEventListener') && !content.includes('removeEventListener')) {
                const relativePath = path.relative(process.cwd(), file);
                issues.push(`Potential memory leak in ${relativePath}: addEventListener without cleanup`);
            }

            // Check for timers without clearing
            if ((content.includes('setTimeout') || content.includes('setInterval')) &&
                !content.includes('clearTimeout') && !content.includes('clearInterval')) {
                const relativePath = path.relative(process.cwd(), file);
                issues.push(`Potential memory leak in ${relativePath}: Timer without cleanup`);
            }
        });
    }

    checkForInfiniteLoops(dir, issues) {
        const files = this.getJSFiles(dir);

        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');

            // Check for potential infinite re-renders
            if (content.includes('useState') && content.includes('useEffect')) {
                // Look for state updates in useEffect without proper dependencies
                const useEffectMatches = content.match(/useEffect\s*\(\s*\(\s*\)\s*=>\s*{[^}]*}/g);
                if (useEffectMatches) {
                    useEffectMatches.forEach(match => {
                        if (match.includes('set') && !match.includes('[]')) {
                            const relativePath = path.relative(process.cwd(), file);
                            issues.push(`Potential infinite loop in ${relativePath}: State update in useEffect`);
                        }
                    });
                }
            }
        });
    }

    checkForMissingCleanup(dir, issues) {
        const files = this.getJSFiles(dir);

        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');

            // Check for Firebase listeners without unsubscribe
            if (content.includes('onSnapshot') && !content.includes('unsubscribe')) {
                const relativePath = path.relative(process.cwd(), file);
                issues.push(`Missing cleanup in ${relativePath}: Firebase listener without unsubscribe`);
            }

            // Check for subscription patterns without cleanup
            if (content.includes('.subscribe(') && !content.includes('.unsubscribe(')) {
                const relativePath = path.relative(process.cwd(), file);
                issues.push(`Missing cleanup in ${relativePath}: Subscription without unsubscribe`);
            }
        });
    }

    getJSFiles(dir) {
        const files = [];

        const scan = (currentDir) => {
            const items = fs.readdirSync(currentDir);

            items.forEach(item => {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    scan(fullPath);
                } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
                    files.push(fullPath);
                }
            });
        };

        scan(dir);
        return files;
    }

    calculateScore() {
        let score = 100;

        // Deduct points for large bundles
        if (this.results.bundleSize.total > 2000) {
            score -= 20;
        } else if (this.results.bundleSize.total > 1000) {
            score -= 10;
        }

        // Deduct points for code issues
        score -= Math.min(this.results.codeAnalysis.totalIssues * 5, 50);

        this.results.score = Math.max(score, 0);
        return this.results.score;
    }

    generateReport() {
        const score = this.calculateScore();

        console.log('\n📊 PERFORMANCE REPORT');
        console.log('='.repeat(50));
        console.log(`Overall Score: ${score}/100`);

        if (score >= 90) {
            console.log('🎉 Excellent performance!');
        } else if (score >= 70) {
            console.log('✅ Good performance with room for improvement');
        } else if (score >= 50) {
            console.log('⚠️  Performance needs attention');
        } else {
            console.log('❌ Poor performance - immediate action required');
        }

        console.log('\n📦 Bundle Analysis:');
        console.log(`Total Size: ${this.results.bundleSize.total || 0}KB`);

        console.log('\n🔍 Code Analysis:');
        console.log(`Issues Found: ${this.results.codeAnalysis.totalIssues || 0}`);

        if (this.results.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            this.results.recommendations.forEach(rec => console.log(`   ${rec}`));
        }

        // Save detailed report
        const reportPath = path.join(process.cwd(), 'performance-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    }

    async run() {
        console.log('🚀 Starting performance check...\n');

        await this.checkBundleSize();
        await this.analyzeCode();

        this.generateReport();
    }
}

// Run the performance check
const checker = new PerformanceChecker();
checker.run().catch(console.error);
