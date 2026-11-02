import { describe, expect, it } from 'vitest'
import { parseProgram, simulate } from '../src/components/visuals/sim/engine'

const COUNTER = `
reg clk;
reg rstn;
reg [3:0] cnt;

always #5 clk = ~clk;

initial begin
  clk = 0;
  rstn = 0;
  cnt = 0;
  #15 rstn = 1;
end

always @(posedge clk) begin
  if (rstn) cnt <= cnt + 1;
  else cnt <= 0;
end
`

describe('微型 Verilog 仿真引擎', () => {
  it('解析出信号、时钟与顺序块', () => {
    const program = parseProgram(COUNTER)
    const names = program.signals.map(s => s.name)
    expect(names).toEqual(expect.arrayContaining(['clk', 'rstn', 'cnt']))
    expect(program.clocks.length).toBeGreaterThan(0)
    expect(program.seqBlocks.length).toBeGreaterThan(0)
  })

  it('时钟按 #5 翻转，rstn 在 15ns 释放', () => {
    const program = parseProgram(COUNTER)
    const signals = simulate(program, 30)
    const clk = signals.find(s => s.name === 'clk')!
    const rstn = signals.find(s => s.name === 'rstn')!

    expect(clk.edges.length).toBeGreaterThanOrEqual(5)
    // 5ns 第一次翻转
    expect(clk.edges.some(([t, v]) => t === 5 && v === 1)).toBe(true)
    // 15ns 释放复位
    expect(rstn.edges.some(([t, v]) => t === 15 && v === 1)).toBe(true)
  })

  it('复位释放后计数器开始递增', () => {
    const program = parseProgram(COUNTER)
    const signals = simulate(program, 100)
    const cnt = signals.find(s => s.name === 'cnt')!
    const last = cnt.edges[cnt.edges.length - 1][1]
    expect(last).toBeGreaterThan(0)
  })

  it('组合逻辑 assign 会随输入更新', () => {
    const program = parseProgram(`
reg a;
reg b;
wire y;
assign y = a & b;
initial begin
  a = 1;
  b = 0;
  #10 b = 1;
end
`)
    const signals = simulate(program, 20)
    const y = signals.find(s => s.name === 'y')!
    expect(y.edges.some(([t, v]) => t === 10 && v === 1)).toBe(true)
  })
})
