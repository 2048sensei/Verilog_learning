// ============================================================
// Verilog 课程数据
// 素材来源: 菜鸟教程 https://www.runoob.com/w3cnote/verilog-tutorial.html
// 交互设计参考: HDLBits (https://hdlbits.01xz.net/)
// ============================================================

import type { QuizQuestion } from '../components/Quiz'
import type { VisualBlock } from '../components/visuals'

// ---- 类型定义 ----

export interface CodeExample {
  code: string
  caption?: string
  filename?: string
  highlightLines?: number[]
}

export interface InfoBox {
  type: 'tip' | 'warning' | 'danger'
  content: string
}

export interface CompareTable {
  title: string
  headers: string[]
  rows: string[][]
}

export interface Lesson {
  id: string
  title: string
  type: 'article' | 'quiz' | 'project'
  estimatedMinutes: number
  content?: string           // HTML 内容
  codeExamples?: CodeExample[]
  infoBoxes?: InfoBox[]
  compareTable?: CompareTable
  quiz?: { questions: QuizQuestion[] }
  fillBlank?: { questions: { id: string; prompt: string; answer: string; accept?: string[]; explanation: string }[] }
  truthTable?: {
    title: string
    inputLabels: string[]
    outputLabel: string
    rows: TruthTableRow[]
    rowsToGuess: number[]
    description?: string
  }
  /** 可视化交互演示 */
  visuals?: VisualBlock[]
}

export interface Chapter {
  id: string
  title: string
  description: string
  lessons: Lesson[]
}

// ---- TruthTableRow 类型（内联，避免跨组件类型依赖） ----
interface TruthTableRow {
  inputs: Record<string, 0 | 1>
  output: 0 | 1
}

// ---- 课程数据 ----

export const chapters: Chapter[] = [
  // ==================== 第1章 入门 ====================
  {
    id: 'ch01-intro',
    title: '入门基础',
    description: '用真实代码直接上手：从一段能跑的计数器代码认识 Verilog，再走一遍真实项目的完整开发流程',
    lessons: [
      {
        id: 'ch01-l01',
        title: 'Verilog 是什么：从一段真实代码开始',
        type: 'article',
        estimatedMinutes: 15,
        content: `
<h2>先跑一段真实的 Verilog 代码</h2>
<p>很多教材的第一课讲 Verilog 的历史、"什么是硬件描述语言"，讲完之后你依然不知道它长什么样。这一节我们反过来：<strong>先看一段真实芯片里天天在运行的代码，把它跑起来、改起来</strong>，在运行中认识这门语言。</p>
<p>本节仿真器里是一段<strong>4 位十进制计数器</strong>（从 0 数到 9 后自动回到 0，循环往复）。它来自菜鸟教程 Verilog 教程的"第一个 Verilog 设计"，是数字时钟、秒表、数码管显示这些真实项目的基础模块。</p>
<p>请做两件事：</p>
<ol>
  <li>点<strong>"运行仿真"</strong>，看波形：<code>cnt_temp</code> 是不是 0→1→2→…→9，然后回到 0？</li>
  <li>把代码里 <code>4'd9</code> 改成 <code>4'd5</code>（共 3 处），再运行——计数范围立刻变成 0→5，一个"十进制计数器"变成了"六进制计数器"。</li>
</ol>
<p><strong>这就是硬件设计的日常：改一个数，电路行为就变。</strong>仿真器上方有预设按钮，可以一键切换不同改法对比波形。</p>

<h2>逐行拆解：这段代码在芯片里对应什么</h2>
<p>不要把 Verilog 当编程语言去背，把它当成<strong>一张电路图纸的文字版</strong>。逐行看这段代码对应什么物理电路：</p>

<h3>① 时钟：一个永远在翻转的信号</h3>
<pre><code>always #5 clk = ~clk;</code></pre>
<p>这一行制造了一个<strong>每 5ns 翻转一次</strong>的信号 <code>clk</code>：低→高→低→高……这就是芯片里真实存在的<strong>时钟（Clock）</strong>，所有时序逻辑都踩着它的节拍工作。手机、电脑里的芯片，内部都有一个更高频的时钟在这样翻转。</p>

<h3>② 敏感列表：什么时候"醒"一下</h3>
<pre><code>always @(posedge clk or negedge rstn) begin
  ...
end</code></pre>
<p><code>always</code> 块像一个值班的人，平时闲着，等<strong>敏感列表</strong>里的事件发生才工作一次：</p>
<ul>
  <li><code>posedge clk</code> —— 时钟的<strong>上升沿</strong>（从低变高的瞬间）</li>
  <li><code>negedge rstn</code> —— 复位信号 <code>rstn</code> 的<strong>下降沿</strong>（从高变低的瞬间）</li>
</ul>
<p>信号名带 <code>n</code> 通常表示<strong>低电平有效</strong>：<code>rstn</code> 为 0 时电路被复位。这是硬件工程师的命名习惯，第 4 章会展开。</p>

<h3>③ 非阻塞赋值 ≤：把值"装进寄存器"</h3>
<pre><code>cnt_temp <= cnt_temp + 1'b1;</code></pre>
<p><code>&lt;=</code> 读作"非阻塞赋值"。它的特点是：<strong>等这个 always 块全部执行完、时钟沿过后，新值才真正生效</strong>。想象 <code>cnt_temp</code> 是 4 个小盒子（寄存器），每个时钟沿，盒子里的数统一加 1。因为所有赋值"同时发生"，多个信号不会相互覆盖——这是时序电路正确性的基石。</p>

<h3>④ 条件分支：电路如何"决策"</h3>
<pre><code>if (!rstn)                 cnt_temp &lt;= 4'b0;  // 复位 → 归零
else if (cnt_temp == 4'd9)  cnt_temp &lt;= 4'b0;  // 数到 9 → 回 0
else                        cnt_temp &lt;= cnt_temp + 1'b1; // 否则 +1</code></pre>
<p>语法长得和 C 一样，但含义完全不同：这里描述的是一个<strong>真实的选择电路</strong>（比较器 + 多路选择器 MUX），硬件根据条件决定走哪条路。</p>

<h3>⑤ assign：一根"实时连着的导线"</h3>
<pre><code>assign cout = (cnt_temp == 4'd9);</code></pre>
<p><code>assign</code> 是<strong>连续赋值</strong>：右边一变，左边立刻跟着变，没有延迟，就像一根导线。<code>cout</code> 在 <code>cnt_temp</code> 等于 9 时输出 1，这是给下一级电路用的"进位脉冲"。</p>

<h2>Verilog 和 C 的本质区别：并行 vs 顺序</h2>
<table>
  <thead><tr><th></th><th>C 语言</th><th>Verilog</th></tr></thead>
  <tbody>
    <tr><td>本质</td><td>告诉 CPU <strong>一步步</strong>执行指令</td><td>描述<strong>电路怎么连接</strong></td></tr>
    <tr><td>执行</td><td>从上到下，一次一条</td><td>所有 always/assign <strong>同时并行</strong>运行</td></tr>
    <tr><td>时间</td><td>几乎没有时间概念</td><td>每个信号都有真实的时间（纳秒级）</td></tr>
    <tr><td>改动</td><td>改代码 → 重新编译</td><td>改代码 → 重新生成电路</td></tr>
  </tbody>
</table>
<p>看一个最直观的例子。C 代码：</p>
<pre><code>int a = 1, b = 2;
a = b;   // 先执行：a 变成 2
b = 1;   // 后执行：b 变成 1
// 最终：a = 2，b = 1</code></pre>
<p>同样的逻辑，Verilog 这样写：</p>
<pre><code>always @(posedge clk) begin
  a &lt;= b;   // 两个赋值"同时"发生
  b &lt;= 1;
end
// 时钟沿过后：a 取 b 的旧值，b 变 1 —— 两行不互相影响</code></pre>
<p>C 里 <code>a = b</code> 先执行，会读到 <code>b</code> 的旧值还是新值取决于顺序；Verilog 里两条赋值<strong>在同一时刻同时发生</strong>。理解"并行"，是跨过 Verilog 门槛的第一道坎。</p>

<div class="info-box tip">
  <p class="font-medium mb-1">💡 为什么叫"硬件描述语言"</p>
  <p>Verilog 写的是<strong>电路</strong>，不是程序。你的代码最终会被"翻译"成芯片里的门电路、触发器、连线——这个过程叫<strong>综合</strong>（下一节讲）。所以写每一行，都要问自己：<strong>我写的这段，对应什么电路？</strong></p>
</div>

<h2>它从哪来：一句话历史</h2>
<p>Verilog 由 Phil Moorby 于 1983 年在 Gateway Design Automation 公司发明，最初是内部仿真验证工具；1995 年成为 IEEE 首个标准（IEEE Std 1364-1995），2001 年推出的 Verilog-2001 是最流行的版本。它借鉴了 C 语言语法，比另一门硬件语言 VHDL 更简洁、更容易上手。（素材来源：菜鸟教程 1.1 节）</p>
        `,
        codeExamples: [
          {
            filename: 'counter10.v',
            caption: '菜鸟教程"第一个 Verilog 设计"：4 位十进制计数器（原版模块。注意它只有电路描述、没有激励——真实工程中激励写在独立的 testbench 里，见 1.2 节）',
            code: `module counter10(
    input rstn, clk,        // 复位端（低有效）、输入时钟
    output [3:0] cnt,       // 计数输出
    output cout);           // 溢出位

reg [3:0] cnt_temp;         // 计数器寄存器
always @(posedge clk or negedge rstn) begin
    if(!rstn) begin             // 复位时，计时归 0
        cnt_temp <= 4'b0;
    end
    else if (cnt_temp==4'd9) begin // 计时10个cycle时，计时归0
        cnt_temp <=4'b000;
    end
    else begin                  // 计时加1
        cnt_temp <= cnt_temp + 1'b1 ;
    end
end
assign  cout = (cnt_temp==4'd9);  // 输出周期位
assign  cnt  = cnt_temp ;         // 输出实时计时器
endmodule`,
          },
        ],
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：4 位十进制计数器',
              duration: 110,
              signals: ['clk', 'rstn', 'cnt_temp', 'cout'],
              initialCode: `// ── 激励（真实工程中写在独立的 testbench 文件里）──
reg clk, rstn;
always #5 clk = ~clk;           // 产生一个每 5ns 翻转的时钟
initial begin
  rstn = 0;                     // 先复位
  #15 rstn = 1;                 // 15ns 后释放复位，开始计数
end

// ── 被测模块：4 位十进制计数器（源：菜鸟教程 counter10）──
reg [3:0] cnt_temp;
wire cout;
always @(posedge clk or negedge rstn) begin
  if (!rstn)
    cnt_temp <= 4'b0;
  else if (cnt_temp == 4'd9)
    cnt_temp <= 4'b0;
  else
    cnt_temp <= cnt_temp + 1'b1;
end
assign cout = (cnt_temp == 4'd9);`,
              presets: [
                { label: '原版：十进制计数', code: `// 计数到 9 回 0（十进制）
reg clk, rstn;
always #5 clk = ~clk;
initial begin
  rstn = 0;
  #15 rstn = 1;
end
reg [3:0] cnt_temp;
wire cout;
always @(posedge clk or negedge rstn) begin
  if (!rstn) cnt_temp <= 4'b0;
  else if (cnt_temp == 4'd9) cnt_temp <= 4'b0;
  else cnt_temp <= cnt_temp + 1'b1;
end
assign cout = (cnt_temp == 4'd9);` },
                { label: '改成六进制', code: `// 把 4'd9 改成 4'd5：0→5 循环（六进制）
reg clk, rstn;
always #5 clk = ~clk;
initial begin
  rstn = 0;
  #15 rstn = 1;
end
reg [3:0] cnt_temp;
wire cout;
always @(posedge clk or negedge rstn) begin
  if (!rstn) cnt_temp <= 4'b0;
  else if (cnt_temp == 4'd5) cnt_temp <= 4'b0;
  else cnt_temp <= cnt_temp + 1'b1;
end
assign cout = (cnt_temp == 4'd5);` },
                { label: '改成同步复位', code: `// 去掉 negedge rstn：复位只在时钟沿判断（同步复位）
reg clk, rstn;
always #5 clk = ~clk;
initial begin
  rstn = 0;
  #17 rstn = 1;
end
reg [3:0] cnt_temp;
wire cout;
always @(posedge clk) begin
  if (!rstn) cnt_temp <= 4'b0;
  else if (cnt_temp == 4'd9) cnt_temp <= 4'b0;
  else cnt_temp <= cnt_temp + 1'b1;
end
assign cout = (cnt_temp == 4'd9);` },
              ],
              caption: '动手：把 4\'d9 改成 4\'d5、或把复位方式改改，点"运行"，观察波形如何变化——这就是在动手中理解硬件。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: '这段 counter10 代码，cnt_temp 计数到几时自动回到 0？',
              options: ['9', '10', '16', '4'],
              answer: '9',
              explanation: '当 cnt_temp == 4\'d9 时执行归 0，计数范围是 0~9 共 10 个值，称为十进制（10 进制）计数器。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: '把代码里所有 4\'d9 改成 4\'d5，计数范围变成？',
              options: ['0~4，五进制', '0~5，六进制', '0~9，不变', '0~5，十进制'],
              answer: '0~5，六进制',
              explanation: '4\'d5 表示数值 5，计到 5 就回 0，范围是 0~5 共 6 个值，称为六进制计数器。这就是"改一个数，电路行为就变"。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: 'Verilog 里的 always 块与 C 语言函数的本质区别是？',
              options: [
                '语法不同',
                'always 块是并行执行的电路描述，C 是顺序执行的指令',
                'always 块不能使用变量',
                'C 语言不能做数学运算',
              ],
              answer: 'always 块是并行执行的电路描述，C 是顺序执行的指令',
              explanation: 'Verilog 描述的是真实电路，所有 always 块同时并行运行；C 语言则是按顺序执行的软件程序。这是两者的根本区别。',
            },
            {
              id: 'q4',
              type: 'single',
              stem: 'rstn 为 0 时电路会怎样？',
              options: ['计数加速', '被复位归零', '无法编译', '输出变成高阻'],
              answer: '被复位归零',
              explanation: 'rstn 是低有效复位信号（名字带 n 表示低有效）：为 0 时执行 if(!rstn) 分支，cnt_temp 被清零。',
            },
          ],
        },
      },
      {
        id: 'ch01-l02',
        title: '真实项目开发流程：从需求到波形',
        type: 'article',
        estimatedMinutes: 20,
        content: `
<h2>场景：给开发板做一个"电子秒表核心"</h2>
<p>假设你拿到一块 FPGA 开发板，任务：做一个<strong>秒表</strong>——每 1 秒数字加 1，显示在数码管上，带"清零"按钮。</p>
<p>这一节不写完整产品，只走一遍<strong>真实开发流程</strong>。看懂它，你就明白 Verilog 在真实项目里是怎么被使用的——这也是你以后自己上手任何项目的路线图。</p>

<h2>第一步：需求分析——把"秒表"翻译成技术指标</h2>
<p>真实项目的第一步不是写代码，而是<strong>把想法变成明确的指标</strong>（菜鸟教程称之为"需求分析"）。把秒表拆开看：</p>
<ul>
  <li>需要一个<strong>时钟源</strong>：开发板通常有 50MHz 晶振，太快了</li>
  <li>需要把 50MHz <strong>分频</strong>成 1Hz（每秒跳一次）</li>
  <li>需要一个<strong>计数器</strong>：从 0 数到 59（秒）再回 0</li>
  <li>需要一个<strong>复位</strong>：按钮按下 → 归零</li>
  <li>需要<strong>显示驱动</strong>：把数字送给数码管</li>
</ul>
<p>于是"秒表"被拆成 4 个模块。任何真实芯片，都是这样从模糊想法拆成明确模块的。</p>

<h2>第二步：功能划分——画出电路"全家福"</h2>
<p>Verilog 采用<strong>自上而下（top-down）</strong>的设计：先定义顶层功能，再逐层拆出子模块（菜鸟教程 1.4 节"Verilog 设计方法"）。秒表核心的层次结构：</p>
<pre><code>top（顶层）
├── clk_div  —— 把 50MHz 分频成 1Hz
├── counter  —— 秒计数器（0→59 回绕）
├── key_ctrl —— 读清零按钮，产生复位信号
└── seg_disp —— 驱动 2 位数码管</code></pre>
<p>每个模块只干一件事、接口清晰，可以并行开发。这就是自上而下方法的好处。</p>

<h2>第三步：RTL 编码——写电路</h2>
<p>以 <code>counter</code> 模块为例。它和上一节的 counter10 本质相同，只是进位到 59（代码示例）。写这一阶段时记住：<strong>每一行都要能被翻译成真实门电路</strong>，这叫可综合的 RTL 代码。</p>

<h2>第四步：写 testbench——给电路"通电"测试</h2>
<p>芯片还没造出来，怎么知道电路对不对？答案是<strong>仿真</strong>：写一个"测试台"（testbench，简称 tb），把被测模块放进去，模拟外部信号（时钟、按钮）喂给它，观察输出。</p>
<p>菜鸟教程作者的原话：<em>"当用 Verilog 设计完成数字模块后进行仿真时，需要在外部添加激励，激励文件叫 testbench。有时 testbench 设计可能比数字模块本身都复杂。"</em></p>
<p>这是 counter 模块配套的 testbench（<code>counter_tb.v</code>）：</p>

<h2>第五步：功能仿真——看波形对不对</h2>
<p>下面把"被测模块 + 激励"合并放进在线仿真器，模拟一次真实的仿真过程。三个预设演示<strong>不同的激励</strong>对同一个模块的影响——这正是 testbench 存在的意义：同一个电路，喂不同输入，看是否如预期工作。</p>

<h2>第六步：逻辑综合——把代码翻译成门电路</h2>
<p>逻辑验证通过后，下一步是<strong>综合（synthesize）</strong>：在标准单元库和设计约束的基础上，把 Verilog 高层次描述转换成<strong>门级网表</strong>（与门、或门、触发器组成的电路图），并在逻辑、时序上做优化，平衡逻辑、面积、功耗（菜鸟教程 1.4 节）。</p>
<p><strong>关键：不是所有 Verilog 都能综合。</strong>菜鸟教程原话：<em>"但不是所有的 Verilog 语句都是可以综合成逻辑单元的，例如时延语句。"</em> 判断依据很简单——<strong>硬件里存在的东西才能综合</strong>：</p>
<table>
  <thead><tr><th>代码</th><th>真实用途</th><th>能否综合</th></tr></thead>
  <tbody>
    <tr><td><code>assign y = a & b;</code></td><td>组合逻辑</td><td>✅ 能 → 变成与门</td></tr>
    <tr><td><code>always @(posedge clk) q &lt;= d;</code></td><td>存储</td><td>✅ 能 → 变成触发器</td></tr>
    <tr><td><code>always #5 clk = ~clk;</code></td><td>测试台造时钟</td><td>❌ 不能 → 只能仿真用</td></tr>
    <tr><td><code>#15 rst_n = 1;</code></td><td>测试台等待</td><td>❌ 不能 → 硬件没有"等待"</td></tr>
  </tbody>
</table>

<h2>第七步：布局布线与下载</h2>
<p>综合出门级网表后，剩下的交给工具和板子：</p>
<ol>
  <li><strong>布局布线</strong>：把门电路摆进 FPGA 的物理资源、连上布线网络（菜鸟教程 1.4 节）。此时电路带上了真实时延。</li>
  <li><strong>时序仿真（后仿真）</strong>：用带时延的精确参数再验一遍；信号跑得太慢会出错，就要回到 RTL 修改，可能反复多次。</li>
  <li><strong>下载验证</strong>：通过开发工具把目标文件下载到 FPGA/CPLD 芯片，在电路板上实际调试。</li>
</ol>

<div class="info-box warning">
  <p class="font-medium mb-1">⚠️ 记住这条主线</p>
  <p><strong>RTL 编码 → 功能仿真 → 逻辑综合 → 布局布线 → 时序仿真 → 下载验证</strong>。绝大多数时间花在"编码 + 仿真 + 修改"上——所以本课程后面的每一章，都会让你动手跑仿真。</p>
</div>
        `,
        codeExamples: [
          {
            filename: 'counter.v',
            caption: '秒计数器模块（RTL）：从 0 数到 59 后回到 0',
            code: `// counter.v —— 秒计数器模块
module counter(
    input  clk,          // 1Hz 时钟（来自分频模块）
    input  rst_n,        // 复位，低有效
    output [5:0] sec     // 秒计数 0~59
);
    reg [5:0] sec_r;
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            sec_r <= 6'd0;
        else if (sec_r == 6'd59)
            sec_r <= 6'd0;   // 数到 59 回 0，并向分钟进位
        else
            sec_r <= sec_r + 1'b1;
    end
    assign sec = sec_r;
endmodule`,
          },
          {
            filename: 'counter_tb.v',
            caption: '配套 testbench：给被测模块喂时钟和复位（#5、$finish 等语句只能用于仿真，不能综合）',
            code: `// counter_tb.v —— 测试台
module counter_tb;
    reg  clk, rst_n;
    wire [5:0] sec;

    // 例化被测模块（DUT：Design Under Test）
    counter u_dut(
        .clk   (clk),
        .rst_n (rst_n),
        .sec   (sec)
    );

    // 产生时钟：周期 10ns
    initial clk = 0;
    always #5 clk = ~clk;

    // 激励：先复位 12ns，再释放，让电路跑 600ns
    initial begin
        rst_n = 0;
        #12   rst_n = 1;
        #600  $finish;   // 仿真结束（$finish 不可综合）
    end
endmodule`,
          },
        ],
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：同一模块，三种不同激励',
              duration: 620,
              signals: ['clk', 'rst_n', 'sec_r', 'sec'],
              initialCode: `// ── 激励（testbench 部分）──
reg clk, rst_n;
always #5 clk = ~clk;           // 周期 10ns 的时钟
initial begin
  rst_n = 0;                    // 先复位
  #12 rst_n = 1;                // 12ns 后释放，开始计数
end

// ── 被测模块：秒计数器（counter.v）──
reg [5:0] sec_r;
wire [5:0] sec;
always @(posedge clk or negedge rst_n) begin
  if (!rst_n) sec_r <= 6'd0;
  else if (sec_r == 6'd59) sec_r <= 6'd0;
  else sec_r <= sec_r + 1'b1;
end
assign sec = sec_r;`,
              presets: [
                { label: '正常计数', code: `// 复位后从 0 数到 59
reg clk, rst_n;
always #5 clk = ~clk;
initial begin
  rst_n = 0;
  #12 rst_n = 1;
end
reg [5:0] sec_r;
wire [5:0] sec;
always @(posedge clk or negedge rst_n) begin
  if (!rst_n) sec_r <= 6'd0;
  else if (sec_r == 6'd59) sec_r <= 6'd0;
  else sec_r <= sec_r + 1'b1;
end
assign sec = sec_r;` },
                { label: '中途按清零', code: `// 秒表走到一半，按钮按下再松开 → 归零重新计
reg clk, rst_n;
always #5 clk = ~clk;
initial begin
  rst_n = 0;
  #12 rst_n = 1;
  #250 rst_n = 0;   // 按下"清零"
  #15 rst_n = 1;    // 松开
end
reg [5:0] sec_r;
wire [5:0] sec;
always @(posedge clk or negedge rst_n) begin
  if (!rst_n) sec_r <= 6'd0;
  else if (sec_r == 6'd59) sec_r <= 6'd0;
  else sec_r <= sec_r + 1'b1;
end
assign sec = sec_r;` },
                { label: '时钟加快', code: `// 把时钟周期从 10ns 改成 4ns，计数明显加快
reg clk, rst_n;
always #2 clk = ~clk;
initial begin
  rst_n = 0;
  #5 rst_n = 1;
end
reg [5:0] sec_r;
wire [5:0] sec;
always @(posedge clk or negedge rst_n) begin
  if (!rst_n) sec_r <= 6'd0;
  else if (sec_r == 6'd59) sec_r <= 6'd0;
  else sec_r <= sec_r + 1'b1;
end
assign sec = sec_r;` },
              ],
              caption: '同一个 counter 模块，换不同激励（复位时机、时钟快慢）波形就不同——这就是为什么真实项目一定要写 testbench 验证。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: '功能仿真（前仿真）主要验证什么？',
              options: ['时序是否满足要求', '逻辑功能的正确性', '功耗是否达标', '面积是否最优'],
              answer: '逻辑功能的正确性',
              explanation: '前仿真不考虑信号延迟等 timing 因素，只验证逻辑上的正确性；时序验证在布局布线后的后仿真阶段进行。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: '下面哪段代码不能综合成真实电路？',
              options: [
                'assign y = a & b;',
                'always @(posedge clk) q <= d;',
                'always #5 clk = ~clk;',
                'assign sec = sec_r;',
              ],
              answer: 'always #5 clk = ~clk;',
              explanation: '#5 时延语句只是仿真里用来"造时钟"的，硬件里没有这种等待，因此不可综合。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '逻辑综合把 Verilog 代码变成什么？',
              options: ['机器码', '门级网表', '波形文件', '测试台'],
              answer: '门级网表',
              explanation: '综合是在标准单元库和设计约束基础上，把高层次 Verilog 描述转换成由门电路组成的门级网表。',
            },
            {
              id: 'q4',
              type: 'single',
              stem: 'testbench 的作用是什么？',
              options: [
                '生成电路门级网表',
                '给被测模块提供激励、观察输出',
                '把程序下载到 FPGA',
                '把 Verilog 编译成机器码',
              ],
              answer: '给被测模块提供激励、观察输出',
              explanation: 'testbench 模拟外部信号（时钟、按钮等）喂给被测模块，并观察输出是否正确，是仿真验证的载体。',
            },
          ],
        },
      },
    ],
  },

  // ==================== 第2章 基础语法 ====================
  {
    id: 'ch02-syntax',
    title: '基础语法',
    description: '在真实模块代码中掌握 Verilog 的语法规则、数值表示、wire/reg 数据类型、向量与操作符——每一节都能在线运行验证',
    lessons: [
      {
        id: 'ch02-l01',
        title: '基础语法：在真实模块里认识格式与命名',
        type: 'article',
        estimatedMinutes: 15,
        content: `
<h2>语法不是用来背的，是用来读代码的</h2>
<p>Verilog 的语法规则很薄，与其逐条背，不如看一段真实代码把它们认出来。本节这段 8 位加法器用到了<strong>分号、大小写、注释、标识符、关键字</strong>。先在仿真器里运行它，试着改改 <code>a</code> 和 <code>b</code> 的数值，感受 <code>sum</code> 如何实时跟随——加法器是芯片里最基础的算术单元。</p>

<h2>规则一：每个语句以分号结束</h2>
<p>Verilog 和 C 一样，<strong>每条语句必须用分号 <code>;</code> 结束</strong>。格式是自由的：可写一行也可拆多行，空白符（空格、换行、制表）在编译时被忽略。所以下面三种写法完全等价：</p>
<pre><code>assign sum = a + b;
assign sum = a
          + b;
assign
  sum = a + b;</code></pre>
<p>但真实项目里工程师约定俗成：<strong>每条语句独占一行、4 空格缩进</strong>，可读性极大提升。</p>

<h2>规则二：区分大小写，关键字全部小写</h2>
<p>Verilog <strong>区分大小写</strong>：<code>clk</code> 和 <code>CLK</code> 是两个完全不同的信号。关键字（<code>module</code>、<code>input</code>、<code>reg</code>、<code>always</code>、<code>assign</code> 等）<strong>全部小写</strong>，不能用它们给信号命名。</p>

<h2>规则三：注释说明"为什么"，而非"是什么"</h2>
<p>单行注释 <code>//</code>，多行注释 <code>/* */</code>。真实项目里的注释长这样：</p>
<pre><code>reg [7:0] sum;      // 加法结果（8bit）
// 冒烟测试：只验证基本加法，不覆盖边界
/* 2001 年优化：把进位链改为 carry-lookahead，
   关键路径缩短 40% */</code></pre>

<h2>规则四：标识符命名——你的代码要给别人读</h2>
<p>标识符必须以字母或下划线开头，可由字母、数字、<code>_</code>、<code>$</code> 组成。更重要的是一线项目里的<strong>命名习惯</strong>：</p>
<table>
  <thead><tr><th>习惯</th><th>例子</th><th>含义</th></tr></thead>
  <tbody>
    <tr><td>后缀 <code>_n</code></td><td><code>rst_n</code></td><td>低电平有效（0 表示复位）</td></tr>
    <tr><td>前缀 <code>r_</code></td><td><code>r_cnt</code></td><td>寄存器（reg）信号</td></tr>
    <tr><td>前缀 <code>w_</code></td><td><code>w_comb</code></td><td>线网（wire）信号</td></tr>
    <tr><td>首字母大写</td><td><code>DataBus</code></td><td>总线 / 向量</td></tr>
  </tbody>
</table>
<p>看本课代码示例里的 <code>adder8.v</code>，你能指出哪些是关键字、哪些是标识符吗？</p>
        `,
        codeExamples: [
          {
            filename: 'adder8.v',
            caption: '真实模块：8 位加法器。module/input/output/assign 是关键字，a/b/sum 是标识符',
            code: `module adder8(
    input  [7:0] a,     // 加数 a（标识符）
    input  [7:0] b,     // 加数 b
    output [8:0] sum    // 进位结果（9bit，防溢出）
);
    assign sum = a + b; // assign 是关键字；连续赋值
endmodule`,
          },
          {
            filename: 'bad_naming.v',
            caption: '命名对比：反面教材（x/y/z 看不出含义）vs 规范命名（信号名说清用途）',
            code: `// 糟糕：x、y、z 完全看不出含义
module m(input a, input b, input c, output x);
reg q;
always @(posedge a) begin
  if (!b) q <= 0;
  else q <= q + 1;
end
assign x = q & c;
endmodule

// 规范：信号名说清用途
module counter_mod(
    input clk,      // 时钟
    input rst_n,    // 复位（低有效）
    input en,       // 使能
    output reg [7:0] count_out
);
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n)       count_out <= 0;
        else if (en)      count_out <= count_out + 1;
    end
endmodule`,
          },
        ],
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：8 位加法器',
              duration: 40,
              signals: ['a', 'b', 'sum'],
              initialCode: `// 8 位加法器：改 a、b 的初值，看 sum 如何实时跟随
reg [7:0] a, b;
wire [7:0] sum;
assign sum = a + b;   // 连续赋值：右边一变，左边立刻变
initial begin
  a = 8'd25;
  b = 8'd17;
  #10 a = 8'hFF;      // 十六进制 255
  #10 b = 8'b0000_0010; // 二进制 2
  #10 a = 8'd0;
end`,
              presets: [
                { label: '25 + 17', code: `// 25 + 17 = 42
reg [7:0] a, b;
wire [7:0] sum;
assign sum = a + b;
initial begin
  a = 8'd25;
  b = 8'd17;
end` },
                { label: '溢出：255 + 2', code: `// 255 + 2 = 257，但 8bit 装不下 → 回绕成 1
reg [7:0] a, b;
wire [7:0] sum;
assign sum = a + b;
initial begin
  a = 8'd255;
  b = 8'd2;
end` },
              ],
              caption: '注意：8bit 只能表示 0~255，255+2 溢出后回绕成 1——这是硬件和软件的重要区别。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: '下面哪个是合法的 Verilog 标识符？',
              options: ['123abc', '$data', '_counter', 'module'],
              answer: '_counter',
              explanation: '标识符必须以字母或下划线开头；module 是关键字，$data 以 $ 开头不合法，123abc 以数字开头不合法。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: 'Verilog 中 clk 和 CLK 是？',
              options: ['同一个信号', '两个不同的信号', '会导致编译错误', 'CLK 是关键字'],
              answer: '两个不同的信号',
              explanation: 'Verilog 区分大小写，clk 与 CLK 是两个完全不同的标识符。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '仿真器里 8\'d255 与 8\'d2 相加，sum 是多少？',
              options: ['257', '255', '1', '溢出报错'],
              answer: '1',
              explanation: '8bit 只能表示 0~255，257 对 256 取模等于 1，这是硬件定宽整数的溢出回绕。',
            },
          ],
        },
      },
      {
        id: 'ch02-l02',
        title: '数值表示：一个字节里装着什么',
        type: 'article',
        estimatedMinutes: 15,
        content: `
<h2>为什么学数值表示：芯片里只有"高低电平"</h2>
<p>芯片里每一根线上要么是高电平（1）、要么是低电平（0）。一个 8bit 信号就是 8 根线。<strong>Verilog 的数值表示，本质就是"把这 8 根线的状态写成你能看懂的形式"</strong>。</p>

<h2>四种基本值</h2>
<ul>
  <li><strong>0</strong> — 低电平 / 假</li>
  <li><strong>1</strong> — 高电平 / 真</li>
  <li><strong>x</strong> — 未知（可能 0 也可能 1，仿真初期的常见状态）</li>
  <li><strong>z</strong> — 高阻（没有驱动源，如三态门未使能时）</li>
</ul>

<h2>带位宽的整数：位宽&rsquo;进制数值</h2>
<p>格式：<code>&lt;位宽&gt;&rsquo;&lt;进制字母&gt;&lt;数值&gt;</code>。进制字母：<code>b</code> 二进制、<code>d</code> 十进制、<code>h</code> 十六进制、<code>o</code> 八进制。</p>
<pre><code>8'b1010_1010   // 8bit 二进制 10101010 = 170
8'd170         // 8bit 十进制 170 —— 和前面的写法是同一个值
8'hAA          // 8bit 十六进制 AA = 170 —— 还是同一个值</code></pre>
<p><strong>三种写法，一个值。</strong>下划线只是给人看的（<code>1010_1010</code> 和 <code>10101010</code> 一样），用于分组。下面仿真器里就让同一个寄存器用三种进制写法赋值，看它最终的值是不是同一个。</p>

<div class="info-box tip">
  <p class="font-medium mb-1">💡 实际开发怎么选进制</p>
  <p>写<strong>寄存器位掩码</strong>用二进制（一眼看出哪些位是 1）；写<strong>颜色/地址</strong>用十六进制；写<strong>计数器初值</strong>用十进制。<code>4'd9</code> 就是"4 位十进制数 9"，第 1 章的计数器就是靠它判断"数到几"。</p>
</div>

<h2>负数与科学计数</h2>
<p>减号放在位宽数字<strong>之前</strong>：<code>-6'd15</code> 表示 6bit 的 -15。写成 <code>4'd-2</code> 是非法的。超大数可用科学计数 <code>1.2e4</code>（即 12000）。</p>

<h2>x 和 z 什么时候出现</h2>
<ul>
  <li><strong>x</strong>：信号没初始化、竞争未解决时，仿真器打 x</li>
  <li><strong>z</strong>：三态门输出未使能时（真实工程里 <code>bus = en ? data : 1'bz</code>）</li>
</ul>
        `,
        codeExamples: [
          {
            caption: '整数表示对照表',
            code: `4'b1011          // 4bit 二进制 = 11
32'h3022_c0de    // 32bit 十六进制（下划线增强可读性）
8'd255          // 8bit 十进制 = 255
8'hFF           // 8bit 十六进制 = 255（同一个值）
-6'd15;         // 负数：6bit 的 -15
1.2e4;          // 科学计数法：12000`,
          },
          {
            filename: 'led_control.v',
            caption: '真实应用：用不同进制点亮开发板 LED（1 亮 0 灭）',
            code: `// 开发板上 8 个 LED，led[0] 是最右边一个
reg [7:0] led;
// 只点最右边：二进制最直观
led = 8'b0000_0001;
// 点亮低 4 位：十六进制更简洁
led = 8'h0F;
// 全亮：十进制 255
led = 8'd255;`,
          },
        ],
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：三种进制，同一个值',
              duration: 40,
              signals: ['led'],
              initialCode: `// 同一个 8bit 寄存器，分别用三种进制写法赋值
reg [7:0] led;
initial begin
  led = 8'hA5;          // 十六进制 1010_0101 = 165
  #10 led = 8'd170;     // 十进制 170
  #10 led = 8'b1010_1010; // 二进制 170 —— 看波形，和上一步的值一样
  #10 led = 8'd0;
end`,
              caption: '波形里 led 的值：165 → 170 → 170 → 0。8\'d170 和 8\'b1010_1010 都是 170，写法不同，电路里完全是同一组电平。',
            },
          },
        ],
        fillBlank: {
          questions: [
            {
              id: 'fb1',
              prompt: 'Verilog 中用 ___ 表示高阻态。',
              answer: 'z',
              accept: ['Z'],
              explanation: 'z / Z 表示高阻（High Impedance），常见于三态门未使能或没有驱动源时。',
            },
            {
              id: 'fb2',
              prompt: '8 位的十进制数 170，用十六进制写作 ___，用二进制写作 ___。',
              answer: "8'hAA, 8'b10101010",
              accept: ["8'hAA,8'b10101010", "8'hAA, 8'b1010_1010"],
              explanation: '170 = 0xAA = 0b10101010。三种进制写法在硬件中是同一组电平。',
            },
          ],
        },
      },
      {
        id: 'ch02-l03',
        title: 'wire 与 reg：连线与存储',
        type: 'article',
        estimatedMinutes: 20,
        content: `
<h2>两种数据类型，两种硬件本质</h2>
<p>Verilog 里最常打交道的两种数据类型，对应两种<strong>不同的硬件本质</strong>：</p>

<h3>wire —— 一根"实时连着的线"</h3>
<ul>
  <li>表示<strong>硬件之间的物理连线</strong>，由驱动源连续驱动</li>
  <li>用 <code>assign</code> 连续赋值：右边一变，左边<strong>立刻</strong>变</li>
  <li>没有驱动时默认值 <strong>z</strong>（高阻）</li>
  <li><strong>不能在 always 块里赋值</strong></li>
</ul>

<h3>reg —— 一个"装值的盒子"</h3>
<ul>
  <li>表示<strong>抽象存储单元</strong>，会一直保持值直到被改写</li>
  <li>在 <code>always</code> / <code>initial</code> 块里赋值</li>
  <li>在时序逻辑里被综合成<strong>触发器</strong>；在组合逻辑里可能只综合成一根线</li>
  <li>默认值 <strong>x</strong>（未知）</li>
</ul>

<p>下面仿真器把两种类型放在同一个电路里对比：<code>comb</code> 是 wire（用 assign），<code>store</code> 是 reg（在时钟沿赋值）。运行后看波形——<strong>comb 在 sel 变化时立刻变，store 却要等下一个时钟沿才变</strong>。</p>

<h2>对照表</h2>
<table>
  <thead><tr><th>特性</th><th>wire</th><th>reg</th></tr></thead>
  <tbody>
    <tr><td>本质</td><td>物理连线</td><td>抽象存储单元</td></tr>
    <tr><td>赋值方式</td><td>assign 连续赋值</td><td>always / initial 块内赋值</td></tr>
    <tr><td>默认值</td><td>z（高阻）</td><td>x（未知）</td></tr>
    <tr><td>综合结果</td><td>组合逻辑连线</td><td>触发器或组合逻辑</td></tr>
    <tr><td>能否在 always 块赋值</td><td>不能</td><td>能</td></tr>
  </tbody>
</table>

<div class="info-box warning">
  <p class="font-medium mb-1">⚠️ 最常见的入门错误</p>
  <p>新手常把 <code>assign</code> 写进 always 块里，或在 always 块里给 wire 赋值——<strong>都会报错</strong>。记住：<strong>assign 只对 wire；always 只对 reg</strong>。反过来，也不能用 assign 给 reg 赋值。</p>
</div>
        `,
        codeExamples: [
          {
            filename: 'data_select.v',
            caption: '真实用法：组合逻辑用 wire + assign，时序存储用 reg + always',
            code: `// —— 组合逻辑：wire + assign ——
wire [7:0] data_sel;
assign data_sel = (addr == 8'hF0) ? data_a : data_b;

// —— 时序逻辑：reg + always ——
reg [7:0] buffer;
always @(posedge clk) begin
    buffer <= data_sel;   // 每个时钟沿把当前值存下来
end`,
          },
        ],
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：wire 实时 vs reg 沿更新',
              duration: 45,
              signals: ['sel', 'comb', 'clk', 'store'],
              initialCode: `// wire：用 assign，sel 一变 comb 立刻变
reg sel;
wire [3:0] comb;
assign comb = {sel, sel, sel, sel};   // sel=0→0000, sel=1→1111

// reg：在时钟沿才更新
reg clk;
reg [3:0] store;
always #5 clk = ~clk;
always @(posedge clk) begin
  store <= comb;          // 每个上升沿采样一次 comb
end

initial begin
  sel = 0;
  store = 0;
  #13 sel = 1;   // comb 立刻变 1111；store 要等下一个上升沿
  #20 sel = 0;   // comb 立刻回 0000；store 再等一个沿
end`,
              caption: '波形对比：comb（wire）在 13ns、33ns 立即变化；store（reg）只在 15ns、35ns 的上升沿才采样变化。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: 'wire 型变量没有驱动时，默认值是什么？',
              options: ['0', '1', 'x（未知）', 'z（高阻）'],
              answer: 'z（高阻）',
              explanation: 'wire 表示物理连线，没有驱动源时缺省值为 z（高阻态）。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: 'reg 型变量一定会被综合成触发器吗？',
              options: ['是的，总是', '不是，组合逻辑中的 reg 可能被综合成连线', '取决于位宽', '取决于仿真工具'],
              answer: '不是，组合逻辑中的 reg 可能被综合成连线',
              explanation: 'reg 只是存储的抽象，在 always @(*) 组合块中可能综合成连线，在 always @(posedge clk) 中才综合成触发器。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '仿真器波形中，comb 在 sel 变化时立即变，store 为什么延迟到下一个时钟沿？',
              options: ['store 有 bug', 'store 是 reg，在时钟沿才更新', 'comb 更新的慢', '仿真器误差'],
              answer: 'store 是 reg，在时钟沿才更新',
              explanation: 'store 在 always @(posedge clk) 里用非阻塞赋值，只有时钟上升沿才会采样更新；comb 用 assign 连续赋值，实时跟随。',
            },
          ],
        },
      },
      {
        id: 'ch02-l04',
        title: '向量、数组与参数：LED 流水灯的零件',
        type: 'article',
        estimatedMinutes: 20,
        content: `
<h2>场景：让 8 个 LED 亮成流水灯</h2>
<p>上一节我们控制单个 LED。真实项目里信号往往是一"束"的：8 个 LED、32 根数据线、16 位地址。本节就用<strong>流水灯</strong>——开发板经典例程——来讲向量、位选、拼接和参数。</p>

<h2>向量：一束并行的线</h2>
<p>位宽大于 1 的 reg/wire 就是<strong>向量（vector）</strong>：</p>
<pre><code>reg [7:0] led;      // 8bit 寄存器，led[7] 是最高位
wire [31:0] addr;   // 32bit 总线</code></pre>
<p>流水灯的思路：<strong>每过一个时钟周期，把 led 里的 1 往左挪一位</strong>。</p>

<h2>位选与拼接：搬动每一位</h2>
<p><strong>位选</strong>取某一 bit：<code>led[7]</code>、<code>led[0]</code>。<strong>拼接</strong>用 <code>{}</code> 把多段拼成一个向量：</p>
<pre><code>led <= {led[6:0], led[7]};   // 循环左移：低 7 位上移，最高位移到最右</code></pre>
<p>这一行就是流水灯的核心：<code>led[6:0]</code> 是位选（取低 7 位），<code>{..., led[7]}</code> 是拼接（把最高位接到最低位），整体就是<strong>循环左移一位</strong>。</p>

<h2>参数：给设计留"旋钮"</h2>
<p><code>parameter</code> 定义常量，改一处全局生效，是真实项目里最常见的"可调参数"：</p>
<pre><code>parameter CNT_MAX = 8'd255;   // 计数上限
parameter LED_NUM = 8;        // LED 个数
localparam CLK_FREQ = 50;     // 内部常量，外部不可改</code></pre>

<h2>数组：多个同类型元件</h2>
<p>向量是"一根多位的线"，<strong>数组</strong>是"多根同类型的线"，如寄存器堆、FIFO：</p>
<pre><code>reg [7:0] mem [0:255];     // 256 个 8bit 存储单元 = 内存
reg [7:0] regfile [0:15];  // 16 个 8bit 寄存器（CPU 的寄存器堆雏形）</code></pre>
        `,
        codeExamples: [
          {
            filename: 'led_shift.v',
            caption: '流水灯完整模块：向量 + 位选 + 拼接',
            code: `module led_shift(
    input  clk,
    input  rst_n,
    output reg [7:0] led
);
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            led <= 8'b0000_0001;   // 复位：只有最右边的灯亮
        else
            led <= {led[6:0], led[7]};  // 循环左移
    end
endmodule`,
          },
          {
            filename: 'param_count.v',
            caption: 'parameter 的真实用法：可复用的计数器',
            code: `module count_10(
    input clk,
    output reg [3:0] cnt
);
    parameter MAX = 4'd9;      // 旋钮：改成 4'd5 就是六进制计数器
    always @(posedge clk) begin
        if (cnt == MAX) cnt <= 4'd0;
        else            cnt <= cnt + 1'b1;
    end
endmodule`,
          },
        ],
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：LED 流水灯',
              duration: 85,
              signals: ['clk', 'led'],
              initialCode: `// 流水灯：每时钟沿循环左移一位
reg clk;
reg [7:0] led;
always #5 clk = ~clk;
always @(posedge clk) begin
  led <= {led[6:0], led[7]};   // 循环左移
end
initial begin
  led = 8'b0000_0001;          // 初始只有 led[0] 亮
end`,
              presets: [
                { label: '循环左移', code: `// 1 往左挪：1,2,4,8,...,128,1
reg clk;
reg [7:0] led;
always #5 clk = ~clk;
always @(posedge clk) begin
  led <= {led[6:0], led[7]};
end
initial begin
  led = 8'b0000_0001;
end` },
                { label: '改成循环右移', code: `// 把拼接改成 {led[0], led[7:1]}：1 往右挪
reg clk;
reg [7:0] led;
always #5 clk = ~clk;
always @(posedge clk) begin
  led <= {led[0], led[7:1]};
end
initial begin
  led = 8'b0000_0001;
end` },
                { label: '初始亮 2 个灯', code: `// 初始亮 2 个灯，会看到两盏灯一起转
reg clk;
reg [7:0] led;
always #5 clk = ~clk;
always @(posedge clk) begin
  led <= {led[6:0], led[7]};
end
initial begin
  led = 8'b0000_0011;
end` },
              ],
              caption: '波形里 led 的值 1→2→4→8→16→32→64→128→1… 就是流水灯。试着把拼接改成右移、改初始值，观察灯的方向和个数变化。',
            },
          },
        ],
        fillBlank: {
          questions: [
            {
              id: 'fb1',
              prompt: 'reg [7:0] mem [0:255] 中，mem 包含 ___ 个存储单元，每个单元位宽 ___ bit。',
              answer: '256, 8',
              accept: ['256,8'],
              explanation: 'mem[0:255] 是数组（256 个单元），reg [7:0] 是向量（每个单元 8bit），总共 2048bit 存储空间。',
            },
            {
              id: 'fb2',
              prompt: '循环左移一位的拼接写法是 led &lt;= ___。',
              answer: '{led[6:0], led[7]}',
              accept: ['{led[6:0],led[7]}'],
              explanation: '{led[6:0], led[7]}：低 7 位上移，最高位接回最低位，实现循环左移。',
            },
          ],
        },
      },
      {
        id: 'ch02-l05',
        title: '表达式与操作符：给电路做算术',
        type: 'article',
        estimatedMinutes: 25,
        content: `
<h2>场景：做一个"能选运算"的算术单元</h2>
<p>处理器里有一块电路叫 <strong>ALU（算术逻辑单元）</strong>，它根据操作码 <code>op</code> 选择做加法、减法、与运算还是移位。本节就用一个迷你 ALU 把 Verilog 的操作符全部"跑起来"。</p>
<p>先看仿真器：<code>op</code> 从 0 变到 3，<code>result</code> 依次输出 <code>a+b</code>、<code>a-b</code>、<code>a&amp;b</code>、<code>a&lt;&lt;1</code>。运行后对照波形，确认每个操作符的结果。</p>

<h2>操作符全景</h2>
<p>Verilog 操作符按优先级从高到低：</p>
<ol>
  <li><strong>单目</strong>：<code>! ~ &amp; ~&amp; | ~| ^ ~^</code></li>
  <li><strong>乘除取模</strong>：<code>* / %</code></li>
  <li><strong>加减</strong>：<code>+ -</code></li>
  <li><strong>移位</strong>：<code>&lt;&lt; &gt;&gt;</code></li>
  <li><strong>关系</strong>：<code>&lt; &lt;= &gt; &gt;=</code></li>
  <li><strong>等价</strong>：<code>== != === !==</code></li>
  <li><strong>逻辑</strong>：<code>&amp;&amp; ||</code></li>
  <li><strong>条件</strong>：<code>?:</code></li>
</ol>
<p>除条件操作符右结合外，其余自左向右。</p>

<h2>最常踩坑的操作符</h2>

<h3>比较与等价</h3>
<p><code>==</code> 遇到 x/z 时结果可能是 x（不确定）；<code>===</code> 能精确比较含 x/z 的值。日常写 <code>if (cnt == 4'd9)</code> 用的是 <code>==</code>。</p>

<h3>移位</h3>
<ul>
  <li>逻辑移位 <code>&lt;&lt;</code> / <code>&gt;&gt;</code>：空位补 0</li>
  <li>算术右移 <code>&gt;&gt;&gt;</code>：空位补<strong>符号位</strong>，保证负数缩小后仍正确</li>
</ul>

<h3>条件操作符（三目）</h3>
<p><code>cond ? a : b</code> 就是一个选择器：条件为真取 a，否则取 b。综合出来就是一个<strong>多路选择器 MUX</strong>。</p>

<div class="info-box tip">
  <p class="font-medium mb-1">💡 运算的位宽陷阱</p>
  <p>8bit 的 <code>a + b</code> 结果默认也是 8bit，溢出会<strong>回绕</strong>。要保留进位，加法器输出应声明成 9bit（第 3 章讲全加器时你会看到）。</p>
</div>
        `,
        codeExamples: [
          {
            filename: 'alu.v',
            caption: '迷你 ALU：用 if/else 按操作码选运算',
            code: `module alu(
    input  [7:0] a, b,
    input  [1:0] op,     // 操作码
    output reg [7:0] result
);
    always @(*) begin
        if (op == 2'd0)      result = a + b;    // 加
        else if (op == 2'd1) result = a - b;    // 减
        else if (op == 2'd2) result = a & b;    // 与
        else                 result = a << 1;   // 左移一位
    end
endmodule`,
          },
          {
            caption: '操作符速查（真实代码里的用法）',
            code: `assign sum  = a + b;              // 加法
assign diff = a - b;              // 减法
assign bits = a & b;              // 按位与
assign all1 = &a;                 // 归约：a 是否全 1
assign none = ~|a;                // 归约：a 是否全 0
assign cmp  = (a >= b) ? 1'b1 : 1'b0;  // 比较 + 三目
assign shl  = a << 2;             // 左移 2 位（乘 4）
assign shr  = a >> 1;             // 右移 1 位（整除 2）`,
          },
        ],
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：迷你 ALU（四种运算）',
              duration: 45,
              signals: ['op', 'a', 'b', 'result'],
              initialCode: `// a=25, b=7，op 每 10ns 换一种运算
reg [7:0] a, b;
reg [1:0] op;
reg [7:0] result;
always @(*) begin
  if (op == 2'd0)      result = a + b;    // 25 + 7 = 32
  else if (op == 2'd1) result = a - b;    // 25 - 7 = 18
  else if (op == 2'd2) result = a & b;    // 25 & 7 = 1
  else                 result = a << 1;   // 25 << 1 = 50
end
initial begin
  a = 8'd25; b = 8'd7; op = 2'd0;
  #10 op = 2'd1;
  #10 op = 2'd2;
  #10 op = 2'd3;
end`,
              caption: '对照波形验证四种运算：32 → 18 → 1 → 50。把 op 的初值改一改，看 result 切换运算。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: 'ALU 仿真中 op=2\'d2 时 result 是多少？',
              options: ['32', '18', '1', '50'],
              answer: '1',
              explanation: 'op=2 走 a & b 分支：25 & 7 = 11001 & 00111 = 00001 = 1。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: '算术右移 >>> 与逻辑右移 >> 的区别是？',
              options: ['没有区别', '>>> 补符号位，>> 补 0', '>>> 只能用于负数', '>> 补符号位，>>> 补 0'],
              answer: '>>> 补符号位，>> 补 0',
              explanation: '算术右移 >>> 用符号位填充高位，保证负数右移后仍为负数；逻辑右移 >> 一律补 0。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '8bit 信号 a + b 溢出时会怎样？',
              options: ['自动变成 16bit', '回绕（对 256 取模）', '报错停止仿真', '变成 x'],
              answer: '回绕（对 256 取模）',
              explanation: '定宽整数溢出后回绕。如 255+2=257，8bit 只保留低 8 位 = 1。要防溢出需把结果声明为更宽。',
            },
          ],
        },
      },
    ],
  },
  // ==================== 第3章 连续赋值与时延 ====================
  {
    id: 'ch03-assign',
    title: '连续赋值与时延',
    description: '用数据流建模直接描述"电路在算什么"，再学会用时延搭建 testbench 激励——两类最常用的实战技能',
    lessons: [
      {
        id: 'ch03-l01',
        title: '连续赋值 assign：用一行代码描述加法器',
        type: 'article',
        estimatedMinutes: 20,
        content: `
<h2>三种建模方式，先学"最快的一种"</h2>
<p>同一个电路可以用三种不同层次的语言描述：</p>
<table>
  <thead><tr><th>建模方式</th><th>描述什么</th><th>例子</th></tr></thead>
  <tbody>
    <tr><td><strong>门级</strong></td><td>一个个逻辑门怎么连</td><td><code>xor (So, Ai, Bi, Ci);</code></td></tr>
    <tr><td><strong>数据流</strong></td><td>数据怎么"流"过去（assign 表达式）</td><td><code>assign So = Ai ^ Bi ^ Ci;</code></td></tr>
    <tr><td><strong>行为级</strong></td><td>电路"该做什么"（always 块）</td><td><code>always @(*) So = Ai ^ Bi ^ Ci;</code></td></tr>
  </tbody>
</table>
<p>入门先学<strong>数据流建模</strong>：它离电路最近，又不用一个个摆门，是真实项目里写组合逻辑的主力。</p>

<h2>assign：右边一变，左边立刻变</h2>
<p><code>assign</code>（连续赋值）的三条铁律：</p>
<ul>
  <li>只能对 <strong>wire</strong> 赋值，不能对 reg</li>
  <li><strong>RHS 任何操作数一变，LHS 立刻重算</strong>——所以叫"连续"</li>
  <li>描述的是<strong>组合逻辑</strong>：没有时钟、没有存储</li>
</ul>
<p>第 2 章我们见过最简单的 8 位加法器。本节看两个实战点：<strong>用拼接一次赋值多个信号</strong>，和<strong>数据流描述真实算术单元</strong>。</p>

<h2>全加器：芯片里最小的"算术大师"</h2>
<p>1 位全加器把输入位 <code>Ai</code>、<code>Bi</code> 和低位进位 <code>Ci</code> 相加，输出和 <code>So</code> 与进位 <code>Co</code>：</p>
<pre><code>So = Ai ^ Bi ^ Ci;
Co = (Ai &amp; Bi) | (Ci &amp; (Ai | Bi));</code></pre>
<p><code>So</code> 和 <code>Co</code> 是两个输出，但可以<strong>用一次拼接赋值搞定</strong>——把 <code>{Co, So}</code> 看成一个 2 位结果：</p>
<pre><code>assign {Co, So} = Ai + Bi + Ci;   // 一行搞定全加器</code></pre>
<p>这就是数据流建模的威力：<strong>你描述"算什么"，工具替你生成门电路</strong>。</p>

<h2>实战：8 位加法器带进位</h2>
<p>8 位加法器就是 8 个 1 位全加器串起来。数据流建模只需要一行：</p>
<pre><code>assign {co, sum} = a + b;   // {co,sum} 是 9bit：最高位是进位</code></pre>
<p>本节仿真器里，<code>a+b</code> 超过 255 时 <code>co</code> 变 1——这就是第 2 章说的溢出回绕的"正确写法"：<strong>把进位存进第 9 位，就不会丢信息</strong>。</p>
        `,
        codeExamples: [
          {
            caption: '1位全加器 — 数据流描述（先看逻辑式，再看拼接写法）',
            code: `module full_adder1(
    input    Ai, Bi, Ci,
    output   So, Co
);
    assign So = Ai ^ Bi ^ Ci;
    assign Co = (Ai & Bi) | (Ci & (Ai | Bi));
endmodule`,
          },
          {
            caption: '更简洁 — 拼接赋值（一次写两个输出）',
            code: `module full_adder1(
    input    Ai, Bi, Ci,
    output   So, Co
);
    assign {Co, So} = Ai + Bi + Ci;   // 把 {Co,So} 当 2 位结果
endmodule`,
            highlightLines: [6],
          },
          {
            caption: '8位加法器带进位：真实算术单元的写法',
            code: `module adder8_carry(
    input  [7:0] a, b,
    output [7:0] sum,
    output       co        // 进位输出
);
    assign {co, sum} = a + b;   // 9bit 拼接：最高位就是进位
endmodule`,
          },
        ],
        truthTable: {
          title: '1位全加器真值表',
          inputLabels: ['Ci', 'Ai', 'Bi'],
          outputLabel: 'So',
          rows: [
            { inputs: { Ci: 0, Ai: 0, Bi: 0 }, output: 0 },
            { inputs: { Ci: 0, Ai: 0, Bi: 1 }, output: 1 },
            { inputs: { Ci: 0, Ai: 1, Bi: 0 }, output: 1 },
            { inputs: { Ci: 0, Ai: 1, Bi: 1 }, output: 0 },
            { inputs: { Ci: 1, Ai: 0, Bi: 0 }, output: 1 },
            { inputs: { Ci: 1, Ai: 0, Bi: 1 }, output: 0 },
            { inputs: { Ci: 1, Ai: 1, Bi: 0 }, output: 0 },
            { inputs: { Ci: 1, Ai: 1, Bi: 1 }, output: 1 },
          ],
          rowsToGuess: [1, 2, 5, 7],
          description: '请根据全加器逻辑 So = Ai⊕Bi⊕Ci，填写下面 4 个 So 值：',
        },
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：8 位加法器带进位',
              duration: 45,
              signals: ['a', 'b', 'co', 'sum'],
              initialCode: `// 数据流一行描述带进位的 8 位加法器
reg [7:0] a, b;
wire [7:0] sum;
wire co;
assign {co, sum} = a + b;    // {co,sum} = 9bit 结果

initial begin
  a = 8'd200; b = 8'd100;   // 200+100=300 → co=1, sum=44
  #15 a = 8'd50;            // 50+100=150 → co=0, sum=150
  #15 a = 8'd255; b = 8'd1; // 255+1=256 → co=1, sum=0
end`,
              presets: [
                { label: '只测一次：255 + 1', code: `// 255+1=256：co=1, sum=0，进位没丢
reg [7:0] a, b;
wire [7:0] sum;
wire co;
assign {co, sum} = a + b;
initial begin
  a = 8'd255; b = 8'd1;
end` },
                { label: '普通加法：50 + 200', code: `// 50+200=250：不超过 255，co=0
reg [7:0] a, b;
wire [7:0] sum;
wire co;
assign {co, sum} = a + b;
initial begin
  a = 8'd50; b = 8'd200;
end` },
              ],
              caption: '波形里 co 在 300、256 时为 1——第 9 位把进位保住了。试着改 a、b 的值，观察 co 什么时候为 1。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: 'assign 语句能对哪种类型的变量赋值？',
              options: ['reg', 'wire', 'parameter', '都可以'],
              answer: 'wire',
              explanation: 'assign 是连续赋值，只能对 wire 赋值；reg 只能在 always/initial 块里赋值。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: 'assign {Co, So} = Ai + Bi + Ci; 中 {Co, So} 是什么意思？',
              options: ['两个独立的赋值', '把 Co 和 So 拼成 2 位结果一次赋值', '语法错误', '先算 Co 再算 So'],
              answer: '把 Co 和 So 拼成 2 位结果一次赋值',
              explanation: '拼接 {Co, So} 表示一个 2 位向量，加法结果整体赋给它：低位是 So，进位是 Co。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '仿真器里 200 + 100 的结果是什么？',
              options: ['co=0, sum=44', 'co=1, sum=44', 'co=1, sum=300', '溢出报错'],
              answer: 'co=1, sum=44',
              explanation: '200+100=300，9bit 表示 100101100：最高位是进位 co=1，低 8 位 sum=44（300-256=44）。',
            },
          ],
        },
      },
      {
        id: 'ch03-l02',
        title: '时延：仿真世界的节拍器',
        type: 'article',
        estimatedMinutes: 15,
        content: `
<h2>为什么需要时延</h2>
<p>真实芯片里信号从 A 传到 B 需要时间。仿真器里我们用 <code>#</code> 符号来"扮演"这个时间：</p>
<pre><code>#10 data = 8'hA5;   // 等 10 个时间单位，再给 data 赋值</code></pre>
<p>时延在实战中只有两个用途，而且<strong>都发生在 testbench 里</strong>：</p>
<ol>
  <li><strong>产生时钟</strong>：<code>always #5 clk = ~clk;</code></li>
  <li><strong>按时间点驱动激励</strong>：<code>#20 rst_n = 1;</code></li>
</ol>

<div class="info-box warning">
  <p class="font-medium mb-1">⚠️ 核心铁律：时延不可综合</p>
  <p>所有 <code>#时延</code> 语句<strong>都不能变成真实硬件电路</strong>——芯片里没有"等待 10 纳秒再翻转"的指令。真实电路的延迟由物理器件和布线决定。<strong>所以 #时延只存在于 testbench（仿真激励）里</strong>，综合工具会直接忽略或报错。</p>
</div>

<h2>时延的三种分类</h2>
<ul>
  <li><strong>上升时延</strong>（rise）：信号 0→1 的延迟</li>
  <li><strong>下降时延</strong>（fall）：信号 1→0 的延迟</li>
  <li><strong>关断时延</strong>（turn-off）：信号变为高阻 z 的延迟</li>
</ul>
<p>精细写法 <code>assign #(5, 3) q = a &amp; b;</code> 表示上升 5、下降 3。日常仿真里直接用 <code>#N</code> 就够。</p>

<h2>实战：testbench 里的激励编排</h2>
<p>本节仿真器演示一段典型 testbench 激励：<strong>时钟从 0 开始持续翻转，复位在 20ns 解除，使能在 30ns 打开</strong>。每个信号在哪个时刻变化，全靠 <code>#</code> 精确控制。</p>
        `,
        codeExamples: [
          {
            caption: '利用时延产生时钟（testbench 标准写法）',
            code: "`timescale 1ns/1ns\n\nmodule clk_gen;\n    reg clk;\n    initial clk = 1'b0;\n    always #5 clk = ~clk;   // 每 5ns 翻转 → 100MHz 时钟\nendmodule",
          },
          {
            caption: '时延的分级写法',
            code: `assign #(5, 3) q = a & b;   // 上升时延5ns，下降时延3ns
// 只写一个也行：assign #5 q = a & b;（上升/下降都是5）`,
          },
        ],
        fillBlank: {
          questions: [
            {
              id: 'fb1',
              prompt: '在 Verilog 仿真中，___ 符号用于表示时延。时延语句是 ___ 综合的。',
              answer: '#',
              accept: ['#, 不可', '#，不可', '# 不可'],
              explanation: '使用 #N 表示延迟 N 个时间单位。# 时延语句不可综合，仅用于仿真（testbench）。',
            },
          ],
        },
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：testbench 激励编排',
              duration: 60,
              signals: ['clk', 'rst_n', 'en'],
              initialCode: `// testbench 典型激励：用 # 精确控制每个信号的时刻
reg clk, rst_n, en;
always #5 clk = ~clk;    // 时钟：每 5ns 翻转
initial begin
  rst_n = 0;             // 先复位
  #20 rst_n = 1;         // t=20 解除复位
  en = 0;
  #30 en = 1;            // t=30 使能打开
end`,
              presets: [
                { label: '复位改成 10ns 解除', code: `// 把 #20 改成 #10：复位更早解除
reg clk, rst_n, en;
always #5 clk = ~clk;
initial begin
  rst_n = 0;
  #10 rst_n = 1;
  en = 0;
  #30 en = 1;
end` },
                { label: '时钟频率翻倍', code: `// always #2 替代 #5：每 2ns 翻转 → 频率变 2.5 倍
reg clk, rst_n, en;
always #2 clk = ~clk;
initial begin
  rst_n = 0;
  #20 rst_n = 1;
  en = 0;
  #30 en = 1;
end` },
              ],
              caption: '看波形：rst_n 在 t=20ns 精确变 1，en 在 t=30ns 变 1——每个跳变时刻都由 # 时延决定。试试改 # 后的数值，波形时刻会跟着变。',
            },
          },
        ],
      },
    ],
  },
  // ==================== 第4章 过程结构 ====================
  {
    id: 'ch04-process',
    title: '过程结构',
    description: '行为级建模的核心：initial/always 过程块、阻塞与非阻塞赋值、条件与循环、时序控制——从"描述电路做什么"到写出真实的计数器、移位寄存器、选择器',
    lessons: [
      {
        id: 'ch04-l01',
        title: 'initial 与 always 块：行为级建模的两大金刚',
        type: 'article',
        estimatedMinutes: 20,
        content: `
<h2>为什么学过程块：从"连门"到"描述行为"</h2>
<p>第 3 章的数据流建模（assign）描述的是"数据怎么流"。而<strong>行为级建模</strong>更进一步：用 <code>initial</code> 和 <code>always</code> 两个<strong>过程块</strong>描述"电路该做什么"。真实项目里，一个模块的行为逻辑几乎全写在 always 块里。</p>
<p>先看本节仿真器——它就是一个带<strong>复位</strong>和<strong>使能</strong>的计数器：<code>always</code> 描述硬件"数到几、什么时候加 1"，<code>initial</code> 扮演 testbench 按时间点给信号。运行后看波形，体会两种过程块的分工。</p>

<h2>铁律一：一个模块可有多个过程块，它们并行执行</h2>
<p>模块里可以有任意多个 initial 和 always，它们<strong>同时从 0 时刻开始、互相独立并行执行</strong>，与书写顺序无关。这一点和第 2 章学的"C 是顺序执行"完全不同。</p>
<ul>
  <li><strong>initial</strong>：从 0 时刻开始，<strong>只执行一次</strong>，执行完就结束</li>
  <li><strong>always</strong>：<strong>循环反复执行</strong>，执行完最后一条马上回到第一条</li>
</ul>

<h2>initial：testbench 里的"指挥家"</h2>
<p>initial 块在真实工程里<strong>几乎只出现在 testbench 里</strong>，用来在特定时刻给信号赋值（产生激励）：</p>
<pre><code>initial begin
    clk = 0;
    rst_n = 0;
    #15 rst_n = 1;   // 15ns 后解除复位
end</code></pre>
<div class="info-box warning">
  <p class="font-medium mb-1">⚠️ 铁律：initial 不可综合</p>
  <p>initial 描述的是"仿真开始时的行为"，<strong>没有对应硬件</strong>。综合工具会忽略或报错。<code>always #5 clk = ~clk;</code> 同样只存在于 testbench。</p>
</div>

<h2>always：真实硬件的"永动机"</h2>
<p>always 是<strong>可综合的</strong>，它描述真实电路。两种经典形态：</p>
<ul>
  <li><code>always @(posedge clk or negedge rst_n)</code> —— <strong>时序逻辑</strong>：每个时钟沿触发，综合成触发器</li>
  <li><code>always @(*)</code> —— <strong>组合逻辑</strong>：任何输入变化即重算，综合成组合电路</li>
</ul>
<p>本节仿真器的 <code>cnt</code> 就是一个时序逻辑：每个时钟上升沿，满足条件就加 1。这就是秒表、定时器的核心。</p>
        `,
        codeExamples: [
          {
            caption: 'initial — 产生测试激励（只执行一次，不可综合）',
            code: "`timescale 1ns/1ns\n\nmodule test;\n    reg clk, rst_n;\n    initial begin\n        clk = 0;\n        rst_n = 0;\n        #15 rst_n = 1;   // 15ns 后解除复位\n    end\nendmodule",
          },
          {
            caption: 'always — 产生 100MHz 时钟（循环执行，只用于 testbench）',
            code: "`timescale 1ns/1ns\n\nmodule test;\n    reg clk;\n    initial clk = 1'b0;\n    always #5 clk = ~clk;   // 每 5ns 翻转 → 100MHz\nendmodule",
          },
          {
            caption: 'always — 可综合的带使能计数器（真实硬件）',
            code: `module cnt_en(
    input clk, rst_n, en,
    output reg [3:0] cnt
);
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n)      cnt <= 4'd0;      // 复位归零
        else if (en)     cnt <= cnt + 1'b1; // 使能才计数
        // 没有 else：en=0 时 cnt 保持原值（触发器天然保持）
    end
endmodule`,
          },
        ],
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：initial 驱动激励 + always 描述硬件',
              duration: 80,
              signals: ['clk', 'rst_n', 'en', 'cnt'],
              initialCode: `// 行为级建模：always 描述硬件，initial 扮演 testbench
reg clk, rst_n, en;
reg [3:0] cnt;
always #5 clk = ~clk;    // always：循环产生时钟
always @(posedge clk or negedge rst_n) begin
  if (!rst_n)      cnt <= 4'd0;       // 复位归零
  else if (en)     cnt <= cnt + 1'b1; // 使能才加 1
end
initial begin
  rst_n = 0;             // initial：先复位
  en = 1;
  #15 rst_n = 1;         // t=15 解除复位 → 开始计数
  #40 en = 0;            // t=55 使能关 → 暂停
  #20 en = 1;            // t=75 使能开 → 继续
end`,
              presets: [
                { label: '一直计数', code: `// en 恒为 1：从复位释放后一直数
reg clk, rst_n, en;
reg [3:0] cnt;
always #5 clk = ~clk;
always @(posedge clk or negedge rst_n) begin
  if (!rst_n)      cnt <= 4'd0;
  else if (en)     cnt <= cnt + 1'b1;
end
initial begin
  rst_n = 0;
  en = 1;
  #15 rst_n = 1;
end` },
                { label: '不复位直接跑', code: `// 去掉复位：cnt 从 x(未知) 开始，体现未复位风险
reg clk, rst_n, en;
reg [3:0] cnt;
always #5 clk = ~clk;
always @(posedge clk or negedge rst_n) begin
  if (!rst_n)      cnt <= 4'd0;
  else if (en)     cnt <= cnt + 1'b1;
end
initial begin
  en = 1;
end` },
              ],
              caption: '看波形：t=15 前 cnt 停在 0（复位）；15~55ns 每个时钟沿 +1；55ns 使能关，cnt 停住；75ns 恢复。一个 always 块 + 一个 initial 块，就是"硬件描述 + 激励"的最小分工。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: 'initial 块和 always 块的主要区别是什么？',
              options: ['initial 可以综合，always 不能', 'initial 只执行一次，always 循环执行', 'initial 比 always 快', '没有区别'],
              answer: 'initial 只执行一次，always 循环执行',
              explanation: 'initial 从 0 时刻开始只执行一次，多用于 testbench 产生激励，不可综合。always 循环反复执行，可综合成真实电路。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: '仿真器里，en=0 的这段时间 cnt 会怎样？',
              options: ['继续计数', '保持原值不变', '变成 x', '回到 0'],
              answer: '保持原值不变',
              explanation: 'if (!rst_n)... else if (en)... 没有 else 分支：en=0 时什么也不做，触发器天然保持当前值。这正体现了硬件"无条件保持"的特性。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '一个模块里多个 initial/always 块的执行关系是？',
              options: ['按书写顺序执行', '并行独立执行，与顺序无关', '只能有一个', 'always 先执行'],
              answer: '并行独立执行，与顺序无关',
              explanation: '所有过程块从 0 时刻同时开始、并行执行，与书写顺序无关。这和 C 语言"自上而下顺序执行"有本质区别。',
            },
          ],
        },
      },
      {
        id: 'ch04-l02',
        title: '阻塞与非阻塞赋值：最容易翻车的地方',
        type: 'article',
        estimatedMinutes: 25,
        content: `
<h2>这是 Verilog 里最容易出错、也最重要的概念</h2>
<p>同一个 <code>q1 &lt;= d; q2 &lt;= q1;</code>，把 <code>&lt;=</code> 换成 <code>=</code>，电路功能就<strong>完全不同</strong>。理解它之前，先看两个仿真器——同一个"移位寄存器"（把数据一拍一拍往后传），用两种赋值写出来，波形天差地别。</p>
<p><strong>先运行"非阻塞（正确）"</strong>，再运行<strong>"阻塞（错误）"</strong>，对比 <code>q1</code>/<code>q2</code>/<code>q3</code> 的波形。</p>

<h2>非阻塞赋值 &lt;= ：先采样、后更新</h2>
<p>非阻塞赋值的核心语义：<strong>在同一个时钟沿，先计算所有右边表达式的值（读旧值），再统一更新左边（写新值）</strong>。所以：</p>
<pre><code>always @(posedge clk) begin
    q1 <= d;    // 读的是 d 的旧值
    q2 <= q1;   // 读的是 q1 的旧值（还没被 q1<=d 改掉）
    q3 <= q2;   // 读的是 q2 的旧值
end</code></pre>
<p>三个语句"同时发生"：一个时钟沿，数据只移动<strong>一格</strong>。所以 d 从第 1 拍进 q1、第 2 拍才到 q2、第 3 拍到 q3——这就是<strong>移位寄存器</strong>，也符合真实触发器"每个时钟沿只更新一次"的物理行为。</p>

<h2>阻塞赋值 = ：立即生效</h2>
<p>阻塞赋值是<strong>顺序执行</strong>：先算先写，下一条语句立刻能读到新值。</p>
<pre><code>q1 = d;    // 立即更新 q1
q2 = q1;   // 读的是刚更新后的 q1
q3 = q2;   // 读的是刚更新后的 q2</code></pre>
<p>结果：一个时钟沿，q1、q2、q3 <strong>全部</strong>变成 d——数据"一穿到底"，不再是移位，功能完全错误。</p>

<div class="info-box danger">
  <p class="font-medium mb-1">🚫 铁律：组合用 =，时序用 &lt;=</p>
  <p><strong>组合逻辑 always @(*) 用阻塞赋值 =</strong>；<strong>时序逻辑 always @(posedge clk) 用非阻塞赋值 &lt;=</strong>。混用的后果极其危险：<strong>仿真波形"看起来对"，综合出的真实电路却行为异常</strong>——这是芯片项目里最经典的翻车现场。</p>
</div>
        `,
        codeExamples: [
          {
            caption: '非阻塞赋值 — 移位寄存器（正确）',
            code: `always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
        q1 <= 1'b0; q2 <= 1'b0; q3 <= 1'b0;
    end else begin
        q1 <= d;      // 一拍一拍向右移
        q2 <= q1;
        q3 <= q2;
    end
end`,
          },
          {
            caption: '阻塞赋值 — 同一电路写错（q1=q2=q3=d）',
            code: `// ⚠️ 错误：把 <= 换成 =，q2=q1 会读到刚更新的 q1
always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
        q1 = 1'b0; q2 = 1'b0; q3 = 1'b0;
    end else begin
        q1 = d;      // 立即生效
        q2 = q1;     // 已是新的 d
        q3 = q2;     // 也是新的 d
    end
end`,
          },
          {
            caption: '组合逻辑用阻塞赋值 =（正确用法）',
            code: `always @(*) begin
    temp = a & b;     // 先算中间结果
    result = temp | c; // 用的是刚算出的 temp
end`,
          },
        ],
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：非阻塞 <=（正确移位）',
              duration: 35,
              signals: ['clk', 'd', 'q1', 'q2', 'q3'],
              initialCode: `// 非阻塞 <=：先采样旧值、时钟沿末统一更新
reg clk, d, q1, q2, q3;
always #5 clk = ~clk;
always @(posedge clk) begin
  q1 <= d;
  q2 <= q1;
  q3 <= q2;
end
initial begin
  d = 0;
  #3 d = 1;   // 一个"1"从 d 注入
end`,
              caption: '看波形：d 的 1 在第 1 拍进 q1、第 2 拍才到 q2、第 3 拍到 q3——数据一拍一拍"移位"，这就是非阻塞赋值的正确行为。',
            },
          },
          {
            type: 'sim',
            props: {
              title: '在线仿真：阻塞 =（错误，数据一穿到底）',
              duration: 35,
              signals: ['clk', 'd', 'q1', 'q2', 'q3'],
              initialCode: `// 阻塞 =：立即生效，下一条读新值 → 全部变 d
reg clk, d, q1, q2, q3;
always #5 clk = ~clk;
always @(posedge clk) begin
  q1 = d;
  q2 = q1;
  q3 = q2;
end
initial begin
  d = 0;
  #3 d = 1;
end`,
              caption: '对比非阻塞版：这里 q1/q2/q3 在同一个时钟沿全部变 1——数据"一穿到底"，不再是移位寄存器。这正是"仿真通过、综合出错"的经典陷阱。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: '在 always @(posedge clk) 块中，应该使用哪种赋值？',
              options: ['阻塞赋值 =', '非阻塞赋值 <=', '两者都可以', 'assign 语句'],
              answer: '非阻塞赋值 <=',
              explanation: '时序逻辑应使用非阻塞赋值 <=，让所有寄存器在同一时钟沿统一更新，符合真实触发器行为。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: '两个仿真器里，阻塞赋值的 q1/q2/q3 有什么现象？',
              options: ['逐拍移位', '同一时钟沿全部变成 d', '都不变化', '变成 x'],
              answer: '同一时钟沿全部变成 d',
              explanation: '阻塞赋值立即生效：q1=d 后，q2=q1 读到新值 d，q3=q2 也读到 d。三个寄存器一拍全部变 d，不再移位。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '在时序逻辑中误用阻塞赋值，最危险的后果是？',
              options: ['编译直接报错', '仿真波形正确，但综合出的真实电路行为不同', '功耗增加', '仿真变慢'],
              answer: '仿真波形正确，但综合出的真实电路行为不同',
              explanation: '这是 Verilog 最经典的陷阱：仿真工具和综合工具对阻塞赋值的解释不同，导致仿真通过、上板却出错。',
            },
          ],
        },
        fillBlank: {
          questions: [
            {
              id: 'fb1',
              prompt: '组合逻辑的 always 块用 ___ 赋值，时序逻辑的 always 块用 ___ 赋值。',
              answer: '阻塞=, 非阻塞<=',
              accept: ['=, <=', '阻塞, 非阻塞', '= ，<=', '阻塞= ，非阻塞<='],
              explanation: '组合逻辑用阻塞赋值 =（立即生效、顺序执行）；时序逻辑用非阻塞赋值 <=（先采样后统一更新）。',
            },
          ],
        },
      },
      {
        id: 'ch04-l03',
        title: '条件语句 if-else：让电路"做决定"',
        type: 'article',
        estimatedMinutes: 15,
        content: `
<h2>场景：4 路选择器——数据从哪条路进来</h2>
<p>if-else 是行为级建模里<strong>最重要的分支结构</strong>。真实场景：CPU 里有大量<strong>多路选择器（MUX）</strong>，根据控制信号选其中一路数据。本节仿真器就是一个 4 路选择器，运行后切换 <code>sel</code>，观察 <code>sout</code> 如何跟随对应的 <code>p0~p3</code>。</p>

<h2>语法要点</h2>
<ul>
  <li>条件表达式必须用<strong>圆括号</strong>：<code>if (sel == 2'b00)</code></li>
  <li><code>else if</code> 可叠加多个</li>
  <li>多条语句用 <code>begin/end</code> 包裹</li>
  <li>注意是 <code>==</code>（比较），不是 <code>=</code>（赋值）</li>
</ul>

<h2>if-else 综合成什么</h2>
<table>
  <thead><tr><th>写法</th><th>综合结果</th></tr></thead>
  <tbody>
    <tr><td>组合逻辑中的完整 if-else</td><td><strong>多路选择器 MUX</strong></td></tr>
    <tr><td>时序逻辑中的 if</td><td><strong>带使能的触发器</strong></td></tr>
    <tr><td>组合逻辑中缺 else</td><td><strong>锁存器 Latch</strong>（要避免！）</td></tr>
  </tbody>
</table>

<div class="info-box danger">
  <p class="font-medium mb-1">🚫 缺 else 的 Latch 陷阱</p>
  <p>组合逻辑里写 <code>if (en) out = data;</code> 而不写 else——当 <code>en=0</code> 时 out 要"保持"原值，综合工具只能生成一个<strong>锁存器 Latch</strong>。Latch 对时序敏感、容易出毛刺，FPGA 设计中应避免。正确写法：<code>if (en) out = data; else out = 1'b0;</code>，保证<strong>所有分支覆盖</strong>。</p>
</div>
        `,
        codeExamples: [
          {
            caption: '4路选择器 — if-else 实现',
            code: `module mux4to1(
    input [1:0]  sel,
    input [1:0]  p0, p1, p2, p3,
    output [1:0] sout
);
    reg [1:0] sout_t;
    always @(*) begin
        if (sel == 2'b00) sout_t = p0;
        else if (sel == 2'b01) sout_t = p1;
        else if (sel == 2'b10) sout_t = p2;
        else sout_t = p3;      // 覆盖所有情况
    end
    assign sout = sout_t;
endmodule`,
          },
          {
            caption: 'Latch 陷阱：缺 else 与补 else 对比',
            code: `// 会生成 Latch（错误）：en=0 时 out 无定义
always @(*) begin
    if (en) out = data;
end

// 纯组合（正确）：覆盖所有分支
always @(*) begin
    if (en) out = data;
    else    out = 1'b0;
end`,
          },
        ],
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：4 路选择器',
              duration: 45,
              signals: ['sel', 'sout', 'p0', 'p1', 'p2', 'p3'],
              initialCode: `// 4 路选择器：sel 选哪路，sout 就跟哪路
reg [1:0] sel;
reg [1:0] p0, p1, p2, p3;
reg [1:0] sout;
always @(*) begin
  if (sel == 2'b00)     sout = p0;
  else if (sel == 2'b01) sout = p1;
  else if (sel == 2'b10) sout = p2;
  else                   sout = p3;
end
initial begin
  p0 = 2'b01; p1 = 2'b10; p2 = 2'b11; p3 = 2'b00;
  sel = 2'b00;
  #10 sel = 2'b01;
  #10 sel = 2'b10;
  #10 sel = 2'b11;
end`,
              presets: [
                { label: '改数据：让 p0=3', code: `// 改输入数据，sel 选中时看新值
reg [1:0] sel;
reg [1:0] p0, p1, p2, p3;
reg [1:0] sout;
always @(*) begin
  if (sel == 2'b00) sout = p0;
  else if (sel == 2'b01) sout = p1;
  else if (sel == 2'b10) sout = p2;
  else sout = p3;
end
initial begin
  p0 = 2'b11; p1 = 2'b10; p2 = 2'b01; p3 = 2'b00;
  sel = 2'b00;
  #10 sel = 2'b10;
end` },
              ],
              caption: '看波形：sel 从 0→3，sout 依次输出 p0=1、p1=2、p2=3、p3=0。if-else 链越写越长时，就该换 case 了（下一节）。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: '组合逻辑的 always 块里，if 缺 else 会综合出什么？',
              options: ['多路选择器', '触发器', '锁存器 Latch', '报错'],
              answer: '锁存器 Latch',
              explanation: '条件不成立时输出需要保持原值，综合工具只能生成电平敏感的锁存器 Latch。FPGA 设计中应避免。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: '仿真器里 sel=2\'b10 时 sout 输出什么？',
              options: ['p0', 'p1', 'p2', 'p3'],
              answer: 'p2',
              explanation: 'else if (sel == 2\'b10) 分支命中，sout = p2 = 2\'b11 = 3。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: 'if 语句里的条件比较用哪个操作符？',
              options: ['=', '==', '<=', ':='],
              answer: '==',
              explanation: 'if 的条件是"比较"：用 ==（等于）、!= 等关系/等价操作符。= 是赋值，写错了编译器会报错或产生意想不到的行为。',
            },
          ],
        },
      },
      {
        id: 'ch04-l04',
        title: '多路分支 case：并行的 if-else',
        type: 'article',
        estimatedMinutes: 15,
        content: `
<h2>场景：当 if-else 越写越长</h2>
<p>if-else 链超过 3 层就难以阅读，而且<strong>有优先级</strong>（先判的优先）。对于"一个值，多个并列分支"的场景，用 <code>case</code> 更清晰：</p>
<pre><code>case (sel)
    2'b00: out = p0;
    2'b01: out = p1;
    2'b10: out = p2;
    2'b11: out = p3;
    default: out = 2'b0;   // 覆盖其余情况，防 Latch
endcase</code></pre>
<p>case 和 if-else 的差别：case 的所有分支<strong>并行比较、地位平等</strong>（没有优先级），通常综合出的电路更小。真实场景里，<strong>状态机的状态转移</strong>、<strong>译码器</strong>、<strong>按键扫描</strong>都用 case。</p>

<h2>case 的三个变体</h2>
<ul>
  <li><strong>case</strong>：精确匹配</li>
  <li><strong>casez</strong>：把 z 位视为"无关位"（don\'t care）</li>
  <li><strong>casex</strong>：把 x 和 z 都视为无关位</li>
</ul>
<pre><code>casez (sel)
    2'b1?: out = data_a;   // ? 等价于 z，最高位为 1 即命中
    default: out = 0;
endcase</code></pre>

<div class="info-box warning">
  <p class="font-medium mb-1">⚠️ 一个硬性约定</p>
  <p>组合逻辑的 case <strong>必须写 default 分支</strong>，否则同 if 缺 else 一样会生成 Latch。</p>
</div>

<h2>本课仿真器说明</h2>
<p>本站在线仿真器支持 if-else 链（case 语法暂不支持），所以用 <strong>if-else 等价实现</strong>演示同一个译码器。你能对照着看出：<strong>case 的每一支，就是 if-else 里的一个分支</strong>。</p>
        `,
        codeExamples: [
          {
            caption: 'case 实现 7 段译码器（真实数码管场景）',
            code: `always @(*) begin
    case (num)
        4'd0: seg = 7'b100_0000;   // 显示 0
        4'd1: seg = 7'b111_1001;   // 显示 1
        4'd2: seg = 7'b010_0100;   // 显示 2
        4'd3: seg = 7'b011_0000;   // 显示 3
        default: seg = 7'b111_1111; // 其余熄灭，防 Latch
    endcase
end`,
          },
          {
            caption: 'casez：把 z/? 当无关位',
            code: `casez (sel)
    2'b0?: out = data_lo;   // 高位为 0 即可命中
    2'b1?: out = data_hi;   // 高位为 1 即命中
    default: out = 1'b0;
endcase`,
          },
        ],
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：case 的 if-else 等价实现',
              duration: 45,
              signals: ['num', 'seg'],
              initialCode: `// case 译码器的 if-else 等价写法：每个 case 分支 = 一个 else if
reg [3:0] num;
reg [6:0] seg;
always @(*) begin
  if (num == 4'd0)      seg = 7'b100_0000; // 0
  else if (num == 4'd1) seg = 7'b111_1001; // 1
  else if (num == 4'd2) seg = 7'b010_0100; // 2
  else if (num == 4'd3) seg = 7'b011_0000; // 3
  else                  seg = 7'b111_1111; // default：防 Latch
end
initial begin
  num = 4'd0;
  #10 num = 4'd1;
  #10 num = 4'd2;
  #10 num = 4'd3;
  #10 num = 4'd9;   // 走 default
end`,
              caption: '波形里 seg 依次是 64、121、36、48、127（十进制）。这就是数码管"段码"，你可以试着把数字 0~3 的段码改一改，看波形怎么变。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: 'casez 与 case 的区别是什么？',
              options: ['没有区别', 'casez 把 z/? 位视为无关位', 'casez 更快', 'casez 只能用于仿真'],
              answer: 'casez 把 z/? 位视为无关位',
              explanation: 'casez 将比较项中的 z/? 位视为无关位（don\'t care），不参与比较。casex 把 x 和 z 都视为无关位。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: 'case 与多层 if-else 相比，优势是？',
              options: ['更快', '分支并行比较、无优先级，代码更清晰', '省内存', '可以比较任意表达式'],
              answer: '分支并行比较、无优先级，代码更清晰',
              explanation: 'case 的所有分支地位平等、并行比较，没有 if-else 的优先级概念，综合结果通常更小、代码更易读。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '组合逻辑的 case 不写 default 会怎样？',
              options: ['没问题', '可能生成 Latch', '编译报错', '变快'],
              answer: '可能生成 Latch',
              explanation: 'case 未覆盖所有情况时，输出在某些条件下无定义，综合工具会生成锁存器。default 分支确保覆盖。',
            },
          ],
        },
      },
      {
        id: 'ch04-l05',
        title: '循环语句：用"重复"描述并行',
        type: 'article',
        estimatedMinutes: 15,
        content: `
<h2>四种循环，只有 for 常用来综合</h2>
<table>
  <thead><tr><th>语句</th><th>特点</th><th>综合</th></tr></thead>
  <tbody>
    <tr><td><strong>for</strong></td><td>有明确次数，可综合</td><td>综合时<strong>展开</strong>成并行硬件</td></tr>
    <tr><td><strong>while</strong></td><td>条件循环</td><td>综合受限</td></tr>
    <tr><td><strong>repeat</strong></td><td>固定次数</td><td>主要用于仿真</td></tr>
    <tr><td><strong>forever</strong></td><td>无限循环</td><td>仅仿真（如产生时钟）</td></tr>
  </tbody>
</table>

<h2>for 综合时会被"展开"</h2>
<p>这是最关键的直觉：<code>for</code> 循环在硬件综合时<strong>不是真的"重复执行"</strong>，而是被<strong>展开</strong>成 8 份并行的操作。下面代码把 8 位数据逆序复制：</p>
<pre><code>integer i;
always @(*) begin
    for (i = 0; i < 8; i = i + 1) begin
        out[i] = in[7 - i];
    end
end</code></pre>
<p>综合工具把它展开成 8 条并行的连线 <code>out[0]=in[7]; out[1]=in[6]; ... out[7]=in[0]</code>——<strong>不是循环 8 次，而是同时存在 8 根线</strong>。</p>

<h2>forever 只在 testbench 里</h2>
<pre><code>initial begin
    clk = 0;
    forever #5 clk = ~clk;   // 无限翻转 → 时钟
end</code></pre>
<p><code>forever</code> 不可综合，只在 testbench 里生成时钟或循环激励。</p>

<div class="info-box tip">
  <p class="font-medium mb-1">💡 循环变量与边界</p>
  <p>可综合的 for 要求：循环变量是<strong>整数</strong>（integer），循环边界是<strong>常数</strong>。这样工具才知道要展开几份。</p>
</div>

<h2>本课仿真器说明</h2>
<p>本站在线仿真器暂不支持 for 语法，这里用<strong>拼接</strong>写 for 展开后的等价形式——你看到的正是综合工具"展开"后生成的电路。</p>
        `,
        codeExamples: [
          {
            caption: 'for 循环 — 逆序复制数据（可综合）',
            code: `integer i;
always @(*) begin
    for (i = 0; i < 8; i = i + 1) begin
        out[i] = in[7 - i];
    end
end`,
          },
          {
            caption: 'for 展开后的等价电路（综合工具生成的）',
            code: `// 综合器把 for 展开成这样：
assign out[0] = in[7];
assign out[1] = in[6];
assign out[2] = in[5];
assign out[3] = in[4];
assign out[4] = in[3];
assign out[5] = in[2];
assign out[6] = in[1];
assign out[7] = in[0];`,
          },
          {
            caption: 'forever — 产生仿真时钟（不可综合）',
            code: `initial begin
    clk = 0;
    forever #5 clk = ~clk;   // 周期 10ns
end`,
          },
        ],
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：for 展开后的逆序复制',
              duration: 15,
              signals: ['in', 'out'],
              initialCode: `// for 展开后的等价：out[i] = in[7-i] 共 8 根并行连线
reg [7:0] in;
wire [7:0] out;
assign out = {in[0], in[1], in[2], in[3],
              in[4], in[5], in[6], in[7]};
initial begin
  in = 8'b0000_0001;   // 1 → out = 1000_0000 = 128
  #5 in = 8'b1010_1010; // 170 → out = 0101_0101 = 85
end`,
              caption: '看波形：in 的每一位被"倒着接"到 out。这就是 for 综合展开后的真实电路——8 根线同时存在，不是循环。',
            },
          },
        ],
        fillBlank: {
          questions: [
            {
              id: 'fb1',
              prompt: '可综合的 for 循环，循环变量类型应为 ___，循环边界应为 ___。',
              answer: 'integer（整数）, 常数',
              accept: ['integer, 常数', '整数, 常数', 'integer，常数', '整数，常数'],
              explanation: '综合工具需要知道循环展开的次数，所以要求循环变量是整数、边界是常数。',
            },
            {
              id: 'fb2',
              prompt: '___ 语句用于产生无限循环的仿真时钟，它 ___（能/不能）被综合。',
              answer: 'forever, 不能',
              accept: ['forever，不能', 'forever,不可', 'forever，不可'],
              explanation: 'forever 无限循环只在 testbench 中使用，不可综合成硬件。',
            },
          ],
        },
      },
      {
        id: 'ch04-l06',
        title: '时序控制：指挥电路"何时动"',
        type: 'article',
        estimatedMinutes: 15,
        content: `
<h2>三种时序控制方式</h2>
<p>Verilog 提供三类"控制执行时机"的语句，理解它们才能精确控制电路和激励的时序。</p>

<h3>① 延迟控制 #（只用于 testbench）</h3>
<pre><code>#10 data = 8'hA5;   // 等 10 个时间单位再执行</code></pre>
<p>第 3 章讲过：<code>#</code> 不可综合，只存在于 testbench。</p>

<h3>② 事件控制 @（可综合的核心）</h3>
<p>等某个事件发生才执行，<strong>是时序逻辑的语法基础</strong>：</p>
<ul>
  <li><strong>边沿敏感</strong>：<code>@(posedge clk)</code> 时钟上升沿、<code>@(negedge rst_n)</code> 复位下降沿</li>
  <li><strong>电平敏感</strong>：<code>@(*)</code> 任何输入变化即触发（组合逻辑）</li>
</ul>

<h3>③ 等待语句 wait（只用于仿真）</h3>
<pre><code>initial begin
    wait (enable == 1'b1);   // 等 enable 变 1 才继续
    $display("enable is high");
end</code></pre>

<h2>边沿采样：posedge 与 negedge 的区别</h2>
<p>本节仿真器里两个寄存器分别采样<strong>上升沿</strong>和<strong>下降沿</strong>：<code>q_pos</code> 在每个上升沿 +1，<code>q_neg</code> 在每个下降沿 +1。运行后看波形——<strong>两个信号错开半拍</strong>，因为它们的采样时刻相差半个时钟周期。</p>
<div class="info-box tip">
  <p class="font-medium mb-1">💡 实际设计用哪个沿？</p>
  <p>一个设计<strong>通常只用 posedge clk</strong> 采样，全模块保持同一套时序，避免混合沿带来的时序复杂化。negedge 常用于异步复位释放或低速接口。</p>
</div>
        `,
        codeExamples: [
          {
            caption: '边沿触发 — 时序逻辑',
            code: `always @(posedge clk or negedge rst_n) begin
    if (!rst_n) q <= 0;
    else        q <= d;
end`,
          },
          {
            caption: '电平敏感 — 组合逻辑',
            code: `always @(*) begin
    out = a & b | c;   // 任何输入变都重算
end`,
          },
          {
            caption: 'wait 语句（仅仿真）',
            code: `initial begin
    wait (enable == 1'b1);
    $display("enable is high");
end`,
          },
        ],
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：上升沿 vs 下降沿采样',
              duration: 45,
              signals: ['clk', 'q_pos', 'q_neg'],
              initialCode: `// 上升沿采样 vs 下降沿采样：错开半拍
reg clk;
reg [3:0] q_pos, q_neg;
always #5 clk = ~clk;
always @(posedge clk) q_pos <= q_pos + 1'b1;  // 上升沿 +1
always @(negedge clk) q_neg <= q_neg + 1'b1;  // 下降沿 +1
initial begin
  q_pos = 0;
  q_neg = 0;
end`,
              caption: '看波形：q_pos 在上升沿（5,15,25ns…）变化，q_neg 在下降沿（10,20,30ns…）变化，两者永远错开半个时钟周期。试着把两个 always 都改成 posedge，波形就同步了。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: '仿真器里 q_pos 和 q_neg 为什么错开半拍？',
              options: ['仿真器 bug', '一个在上升沿采样，一个在下降沿采样', '位宽不同', '初值不同'],
              answer: '一个在上升沿采样，一个在下降沿采样',
              explanation: 'q_pos 用 @(posedge clk)，q_neg 用 @(negedge clk)，两者的采样时刻相差半个时钟周期，所以波形错开半拍。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: '组合逻辑 always 的敏感列表通常写什么？',
              options: ['@(posedge clk)', '@(negedge clk)', '@(*)', '不需要敏感列表'],
              answer: '@(*)',
              explanation: '@(*) 表示"任何输入变化都触发"，是组合逻辑 always 的标准写法，工具自动推导敏感列表。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '下列哪个不可综合，只用于 testbench？',
              options: ['@(posedge clk)', '@(*)', '#10 时延', 'if-else'],
              answer: '#10 时延',
              explanation: '# 时延语句不可综合。@(posedge clk)、@(*)、if-else 都能综合成真实电路。',
            },
          ],
        },
      },
      {
        id: 'ch04-l07',
        title: '语句块：begin/end 与 fork/join',
        type: 'article',
        estimatedMinutes: 15,
        content: `
<h2>两种语句块：顺序 vs 并行</h2>
<p>多条语句可以包成<strong>语句块</strong>。Verilog 有两种：</p>
<table>
  <thead><tr><th>语句块</th><th>执行方式</th><th>时延基准</th><th>可综合</th></tr></thead>
  <tbody>
    <tr><td><strong>begin/end</strong> 顺序块</td><td>从上到下<strong>顺序执行</strong></td><td>相对上一条完成时刻（<strong>累加</strong>）</td><td>可</td></tr>
    <tr><td><strong>fork/join</strong> 并行块</td><td>所有语句<strong>同时执行</strong></td><td>相对块开始时刻（<strong>不累加</strong>）</td><td>否（仅仿真）</td></tr>
  </tbody>
</table>

<h2>顺序块：时延是"累加"的</h2>
<p>begin/end 里每条语句的 <code>#时延</code> 是相对<strong>上一条语句完成</strong>的时刻，所以总耗时是各条之和：</p>
<pre><code>initial begin
    #10 a = 1'b0;   // t=10
    #10 a = 1'b1;   // t=20（相对上一条）
    #10 a = 1'b0;   // t=30
end   // 总耗时 10+10+10 = 30</code></pre>

<h2>并行块：时延是"绝对"的</h2>
<p>fork/join 里所有语句<strong>在 0 时刻同时开始</strong>，每条 <code>#时延</code> 相对块起点计算，总耗时取最长那条：</p>
<pre><code>initial fork
    #50 a = 1'b0;   // t=50（相对块起点）
    #50 b = 1'b1;   // t=50，和 a 同时发生
    #50 c = 1'b0;   // t=50
join   // 总耗时 50（不是 150）</code></pre>

<div class="info-box warning">
  <p class="font-medium mb-1">⚠️ 用途区分</p>
  <p><strong>begin/end 是硬件描述的主力</strong>（时序逻辑、if 分支内都要用）；fork/join 只在 testbench 里让多个激励"同时发生"，<strong>不可综合</strong>。</p>
</div>
        `,
        codeExamples: [
          {
            caption: '顺序块 begin/end — 时延累加',
            code: `// 三条 #10 顺序执行，总耗时 30
initial begin
    #10 a = 1'b0;
    #10 a = 1'b1;
    #10 a = 1'b0;
end`,
          },
          {
            caption: '并行块 fork/join — 时延不累加',
            code: `// 三条 #50 同时开始，总耗时 50（取最长）
initial fork
    #50 a = 1'b0;
    #50 b = 1'b1;
    #50 c = 1'b0;
join`,
          },
        ],
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：顺序块 begin/end（时延累加）',
              duration: 40,
              signals: ['a'],
              initialCode: `// 顺序块：每条 #10 相对上一条完成 → 10/20/30
reg [7:0] a;
initial begin
  a = 8'd0;
  #10 a = 8'd1;   // t=10
  #10 a = 8'd2;   // t=20（相对上一条）
  #10 a = 8'd3;   // t=30
end`,
              caption: '看波形：a 在 10、20、30ns 依次变化——时延相对上一条累加，总耗时 30ns。对比静态图中 fork/join 的同时发生。',
            },
          },
          {
            type: 'wave',
            props: {
              title: '并行块 fork/join — 同时发生',
              signals: [
                { name: 'b', edges: [[0,'0'],[50,'1']] },
                { name: 'c', edges: [[0,'0'],[50,'0']] },
                { name: 'd', edges: [[0,'0'],[50,'0']] },
              ],
              duration: 60,
              step: 10,
              caption: 'fork/join 里三条语句在 0 时刻同时开始，每条 #50 相对块起点，总耗时只有 50（取最长）。和 begin/end 的"累加"形成对比。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: 'begin/end 中两条 #50 语句，总耗时多少？',
              options: ['50', '100', '25', '0'],
              answer: '100',
              explanation: 'begin/end 是顺序块，每条 #50 相对上一条完成时刻，总耗时累加 = 50+50 = 100。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: 'fork/join 中两条 #50 语句，总耗时多少？',
              options: ['50', '100', '25', '0'],
              answer: '50',
              explanation: 'fork/join 所有语句同时开始，时延相对块起点，总耗时取最长那条 = 50。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '硬件设计中（可综合）主要用哪个语句块？',
              options: ['fork/join', 'begin/end', '两者都常用', '都不能综合'],
              answer: 'begin/end',
              explanation: 'begin/end 是顺序块，时序逻辑、if 分支内都用它，可综合。fork/join 只在 testbench 用，不可综合。',
            },
          ],
        },
      },
      {
        id: 'ch04-l08',
        title: '过程连续赋值：仿真调试的"强制手段"',
        type: 'article',
        estimatedMinutes: 10,
        content: `
<h2>什么场景需要它</h2>
<p><strong>过程连续赋值</strong>（procedural assign/deassign）在过程块里<strong>强制驱动</strong>一个 reg，把它的值"钉死"，直到用 <code>deassign</code> 释放。它<strong>不可综合</strong>，只在仿真调试时用：比如想临时强制某个信号、模拟故障注入。</p>
<pre><code>initial begin
    assign q = 1'b1;   // 强制 q 为 1，覆盖其他驱动
    #50;
    deassign q;        // 释放，恢复原驱动
end</code></pre>

<div class="info-box warning">
  <p class="font-medium mb-1">⚠️ 别和连续赋值混淆</p>
  <p>这是两个易混概念：</p>
  <ul>
    <li><strong>连续赋值</strong> <code>assign q = a &amp; b;</code>——模块级、可综合、描述组合逻辑（第 3 章）</li>
    <li><strong>过程连续赋值</strong> <code>assign q = 1'b1;</code>（写在 always/initial 里）——不可综合、只在仿真用</li>
  </ul>
  <p>同样叫 assign，位置不同、性质完全不同。</p>
</div>

<h2>配套的 force/release</h2>
<p>还有一对更常用的调试语句 <code>force/release</code>，能强制驱动<strong>任意信号或实例端口</strong>，同样只用于仿真：</p>
<pre><code>initial begin
    force u_adder.sum = 8'd42;   // 强制内部信号
    #100;
    release u_adder.sum;         // 释放
end</code></pre>

<h2>小结</h2>
<p>过程连续赋值是"仿真专用工具"，让测试工程师能在运行中途强制信号，观察电路在其他情况下的行为。它<strong>不会出现在正式 RTL 代码里</strong>。</p>
        `,
        codeExamples: [
          {
            caption: 'assign/deassign — 强制驱动后释放',
            code: `initial begin
    assign q = 1'b1;   // 强制 q=1，覆盖正常驱动
    #50;
    deassign q;        // 释放，恢复
end`,
          },
          {
            caption: 'force/release — 强制实例内部信号（仅仿真）',
            code: `initial begin
    force u_adder.sum = 8'd42;   // 强制 DUT 内部信号
    #100;
    release u_adder.sum;
end`,
          },
        ],
        fillBlank: {
          questions: [
            {
              id: 'fb1',
              prompt: '过程连续赋值写在 ___ 块内，___（能/不能）综合成硬件。',
              answer: 'always/initial, 不能',
              accept: ['always/initial，不能', '过程块, 不能', 'always/initial,不可', '过程块，不可'],
              explanation: '过程连续赋值（procedural assign）写在 always/initial 过程块内，不可综合，只在仿真调试时强制驱动信号。',
            },
          ],
        },
      },
    ],
  },
  // ==================== 第5章 模块与端口 ====================
  {
    id: 'ch05-module',
    title: '模块与端口',
    description: '把第 2~4 章学的语句"装进盒子"——模块就是芯片的封装。学会解剖真实模块、用模块例化搭芯片、用参数让一个模块通吃多种位宽',
    lessons: [
      {
        id: 'ch05-l01',
        title: '模块解剖：芯片的"外壳"与"引脚"',
        type: 'article',
        estimatedMinutes: 20,
        content: `
<h2>为什么必须学模块：真实项目的最小单位</h2>
<p>第 2~4 章你学会了 <code>assign</code>、<code>always</code>、<code>initial</code>——但它们都不能独立存在，必须"装"进一个盒子里，这个盒子就是<strong>模块 module</strong>。真实项目里：一个计数器、一个 UART 收发器、一块 DDR 控制器，都是一个个模块；顶层模块把它们例化连接起来。模块带来三个真实价值：<strong>复用</strong>（同一个模块被例化 100 次）、<strong>分层</strong>（顶层只关心"谁连谁"）、<strong>分工</strong>（不同工程师写不同模块，最后拼起来）。</p>

<h2>模块骨架：5 个部分（都可选）</h2>
<ol>
  <li>模块声明 <code>module ... endmodule</code></li>
  <li>端口声明（对外接口）</li>
  <li>变量 / 线网声明</li>
  <li>功能语句（assign / always / 模块例化）</li>
  <li>任务与函数</li>
</ol>
<p>它们的书写顺序可以任意，但变量必须<strong>在使用之前声明</strong>。</p>

<h2>端口 = 芯片的"引脚"</h2>
<table>
  <thead><tr><th>方向</th><th>含义</th><th>能否声明为 reg</th></tr></thead>
  <tbody>
    <tr><td><strong>input</strong></td><td>外部输入，只读</td><td>不能</td></tr>
    <tr><td><strong>output</strong></td><td>对外输出</td><td>可以（写成 <code>output reg</code>）</td></tr>
    <tr><td><strong>inout</strong></td><td>双向引脚（如总线）</td><td>不能</td></tr>
  </tbody>
</table>

<h2>解剖一个真实模块</h2>
<p>下面是一个<strong>时钟分频器</strong>模块的完整代码——真实工程里很常见：把高频时钟降成低频（比如把 100MHz 降成 25MHz 点亮慢速外设）。它把计数器和输出"封装"成一个带两个引脚的黑盒子。</p>
<p>本节仿真器演示的是<strong>这个模块的内部行为</strong>：本站仿真器不支持 module 包裹，所以去掉外壳、保留内部逻辑。注意观察 <code>div</code>——它每 2 个时钟周期翻转一次，输出就是"4 分频"的时钟。</p>
        `,
        codeExamples: [
          {
            caption: '时钟分频器 — 完整的真实模块（可综合）',
            code: `// 除以 4 的时钟分频器：div 频率 = clk 频率 / 4
module clk_div(
    input      clk,
    input      rst_n,
    output reg div        // 分频输出
);
    reg [3:0] cnt;
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            cnt <= 4'd0;
            div <= 1'b0;
        end
        else if (cnt == 4'd1) begin   // 每 2 个时钟沿翻转一次
            cnt <= 4'd0;
            div <= ~div;
        end
        else begin
            cnt <= cnt + 1'b1;
        end
    end
endmodule`,
          },
          {
            caption: '端口声明的简化写法（ANSI 风格，推荐）',
            code: `module pad(
    input        DIN, OEN,       // 多个 input 用逗号
    input [1:0]  PULL,
    inout        PAD,            // 双向引脚
    output reg   DOUT            // output reg 合并声明
);
    // 模块内部实现...
endmodule`,
          },
          {
            caption: '空模块骨架（写新模块时的起点）',
            code: `module my_module(
    input        clk,
    input        rst_n,
    input  [7:0] data_in,
    output reg [7:0] data_out
);
    // 1. 内部信号声明

    // 2. 功能：assign / always / 例化

endmodule`,
          },
        ],
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：分频器模块内部（除以 4）',
              duration: 60,
              signals: ['clk', 'rst_n', 'cnt', 'div'],
              initialCode: `// clk_div 模块内部：每 2 个时钟沿 div 翻转一次
// 相当于把 10ns 周期时钟降成 20ns 周期 = 4 分频
reg clk, rst_n;
reg [3:0] cnt;
reg div;
always #5 clk = ~clk;
always @(posedge clk or negedge rst_n) begin
  if (!rst_n) begin
    cnt <= 4'd0;
    div <= 1'b0;
  end
  else if (cnt == 4'd1) begin   // 数到 1 就翻
    cnt <= 4'd0;
    div <= ~div;
  end
  else
    cnt <= cnt + 1'b1;
end
initial begin
  rst_n = 0;
  #7 rst_n = 1;   // 7ns 后解除复位
end`,
              caption: '看波形：div 在 25、45ns 处翻转（每 2 个时钟周期一次），周期正好是 clk 的 4 倍。这就是"分频"。试着把 4\'d1 改成 4\'d3，变成 8 分频，看 div 周期怎么变。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: '模块的 5 个组成部分中，哪个体现了"对外接口"？',
              options: ['模块声明', '端口声明', '变量声明', '功能语句'],
              answer: '端口声明',
              explanation: '端口就是芯片的引脚，是模块与外界交互的接口，方向分 input/output/inout。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: '下列哪种端口可以声明为 reg？',
              options: ['input', 'inout', 'output', '都不能'],
              answer: 'output',
              explanation: 'input 和 inout 只能反映外部信号，不能保存数值，不能是 reg。output 端口可以由 always 块驱动，所以可以写成 output reg。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '仿真器里 div 每几个 clk 时钟周期翻转一次？',
              options: ['1 个', '2 个', '3 个', '4 个'],
              answer: '2 个',
              explanation: 'cnt 数到 1 就翻转，也就是每 2 个时钟沿翻一次，输出周期是 clk 的 4 倍，所以叫"4 分频"。',
            },
          ],
        },
        fillBlank: {
          questions: [
            {
              id: 'fb1',
              prompt: '模块的 5 部分中，___ 声明模块的对外接口，用 input/output/___ 三种方向表示。',
              answer: '端口, inout',
              accept: ['端口，inout', '端口,双向', '端口，双向'],
              explanation: '端口声明定义模块的对外接口，方向有三种：input（输入）、output（输出）、inout（双向）。',
            },
          ],
        },
      },
      {
        id: 'ch05-l02',
        title: '模块例化：把模块当"芯片"插接',
        type: 'article',
        estimatedMinutes: 20,
        content: `
<h2>场景：拿到一块"芯片"，怎么用？</h2>
<p>模块定义好了，就像造好了一块芯片。要用它，就得在更高层模块里<strong>例化（实例化）</strong>：把芯片插到板子上，用导线连接它的引脚。这是<strong>层次化设计</strong>的核心——真实的 CPU、SOC 都是几百个模块一层层例化拼起来的。</p>

<h2>两种连线方式</h2>
<ul>
  <li><strong>按位置</strong>：端口必须按声明顺序填写——改一个就全错，<strong>不推荐</strong></li>
  <li><strong>按名称</strong>：<code>.端口名(连线名)</code>，顺序无关、一目了然，<strong>推荐</strong></li>
</ul>

<h2>真实项目：用全加器搭 4 位加法器</h2>
<p>（示例来自 runoob.com 的 Verilog 教程）先用门级逻辑写一个 1 位全加器模块，然后在顶层把它<strong>例化 4 次</strong>，连成一个 4 位行波进位加法器——每一位的进位 <code>carry[i+1]</code> 送给下一位。这就是"从小模块拼大芯片"的经典套路：</p>
<p>本节仿真器把 4 个全加器<strong>展开后的连线</strong>直接画了出来（仿真器不支持例化，这是综合工具最终生成的等价电路）。运行它，输入不同数据，看进位怎么从最低位"一路传到"最高位。</p>
        `,
        codeExamples: [
          {
            caption: '第一步：1 位全加器模块（runoob 教程示例）',
            code: `module full_adder1(
    input  Ai, Bi, Ci,
    output So, Co
);
    assign So = Ai ^ Bi ^ Ci;                    // 和
    assign Co = (Ai & Bi) | (Ci & (Ai | Bi));    // 进位
endmodule`,
          },
          {
            caption: '第二步：顶层例化 4 次，搭 4 位加法器（runoob 教程示例）',
            code: `module top(
    input  [3:0] Ai,
    input  [3:0] Bi,
    input        Ci,
    output [3:0] So,
    output       Co
);
    wire [3:0] carry;
    assign carry[0] = Ci;      // 最低位进位接输入
    assign Co = carry[4];      // 最高位进位接输出

    // 按位置连接（不推荐）
    full_adder1 u_adder0(Ai[0], Bi[0], Ci, So[0], carry[1]);
    // 按名称连接（推荐）
    full_adder1 u_adder1(.Ai(Ai[1]), .Bi(Bi[1]), .Ci(carry[1]), .So(So[1]), .Co(carry[2]));
    full_adder1 u_adder2(.Ai(Ai[2]), .Bi(Bi[2]), .Ci(carry[2]), .So(So[2]), .Co(carry[3]));
    full_adder1 u_adder3(.Ai(Ai[3]), .Bi(Bi[3]), .Ci(carry[3]), .So(So[3]), .Co(carry[4]));
endmodule`,
          },
          {
            caption: 'generate — 用 for 批量例化',
            code: `genvar i;
generate
    for (i = 0; i < 4; i = i + 1) begin: adder_chain
        full_adder1 u_adder(
            .Ai (Ai[i]),
            .Bi (Bi[i]),
            .Ci (carry[i]),
            .So (So[i]),
            .Co (carry[i+1])
        );
    end
endgenerate`,
          },
        ],
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：4 个全加器连成 4 位加法器',
              duration: 25,
              signals: ['a', 'b', 'ci', 's', 'c1', 'c2', 'c3', 'co'],
              initialCode: `// 4 位行波进位加法器——4 个 full_adder1 例化展开后的连线
reg [3:0] a, b;
reg ci;
wire [3:0] s;
wire c1, c2, c3, co;   // 级间进位，就是上例的 carry[1..4]
// 第 0 位：a0 b0 ci
assign s[0] = a[0]^b[0]^ci;
assign c1 = (a[0]&b[0]) | (a[0]&ci) | (b[0]&ci);
// 第 1 位
assign s[1] = a[1]^b[1]^c1;
assign c2 = (a[1]&b[1]) | (a[1]&c1) | (b[1]&c1);
// 第 2 位
assign s[2] = a[2]^b[2]^c2;
assign c3 = (a[2]&b[2]) | (a[2]&c2) | (b[2]&c2);
// 第 3 位
assign s[3] = a[3]^b[3]^c3;
assign co = (a[3]&b[3]) | (a[3]&c3) | (b[3]&c3);
initial begin
  a = 4'b0101; b = 4'b0011; ci = 0;  // 5+3=8 → s=8, co=0
  #10 a = 4'b1111; b = 4'b0001;      // 15+1=16 → s=0, co=1（进位溢出）
end`,
              caption: '看波形：5+3 时 s=8、co=0；15+1 时 s=0、co=1（进位溢出）。中间的 c1/c2/c3 就是 carry 进位线——c3 在第二个例子变成 1，说明进位传到了最高位。这就是例化 4 个全加器后的真实连线行为。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: '模块例化时，推荐哪种端口连接方式？',
              options: ['按位置连接', '按名称连接 .port(sig)', '两种都推荐', '不需要连接'],
              answer: '按名称连接 .port(sig)',
              explanation: '按名称连接 .port(sig) 顺序无关、可读性强，是工业界推荐写法。按位置连接一旦端口顺序变了就全错，不推荐。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: '4 位行波进位加法器中，carry[i+1] 起到什么作用？',
              options: ['独立信号', '把上一位的进位传给下一位', '时钟信号', '复位信号'],
              answer: '把上一位的进位传给下一位',
              explanation: '行波进位加法器把每个全加器的进位输出接到下一个全加器的进位输入，进位像波浪一样从低位传到高位。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '仿真器里 15+1 的结果是 s=0、co=1，说明什么？',
              options: ['算错了', '4 位溢出，最高进位为 1', '加法器坏了', '没有意义'],
              answer: '4 位溢出，最高进位为 1',
              explanation: '15+1=16，4 位只能表示 0~15，所以 s=0，溢出的进位由 co 输出。这就是进位输出在真实设计中的意义。',
            },
          ],
        },
      },
      {
        id: 'ch05-l03',
        title: '参数传递：一个模块，N 种用法',
        type: 'article',
        estimatedMinutes: 20,
        content: `
<h2>场景：同一份逻辑，位宽却不一样</h2>
<p>假如你写了一个 8 位计数器，第二天要在另一个项目里用 16 位的——难道把代码复制一份改 8→16？<strong>参数（parameter）</strong>就是为此而生：把位宽、分频系数这些"可变的常量"写成参数，例化时按需覆盖。一个模块定义，N 种用法。</p>

<h2>声明参数 + 例化时覆盖</h2>
<pre><code>// 定义：默认 8 位
module cnt #(parameter WIDTH = 8) (
    input clk, rst_n,
    output reg [WIDTH-1:0] cnt_out
);
    always @(posedge clk or negedge rst_n)
        if (!rst_n) cnt_out <= 0;
        else        cnt_out <= cnt_out + 1'b1;
endmodule

// 用法 1：例化一个 8 位的
cnt #(.WIDTH(8)) u_cnt8 (...);
// 用法 2：例化一个 16 位的
cnt #(.WIDTH(16)) u_cnt16 (...);</code></pre>

<div class="info-box tip">
  <p class="font-medium mb-1">💡 更推荐的写法</p>
  <p>新版 Verilog（-2005 以后）推荐在 <code>module</code> 行用 <code>#(parameter ...)</code> 声明参数。老式 <code>defparam</code> 也能改参数，但因容易出错，已经不被推荐。</p>
</div>

<h2>本课仿真器：同一模块，两个"实例"</h2>
<p>本节仿真器里"例化"了<strong>两份一模一样的分频器逻辑</strong>，只是分频系数参数不同：实例 A 数到 1 就翻转（4 分频），实例 B 数到 2 才翻转（6 分频）。看波形——<strong>同样的代码结构，参数不同，行为完全不同</strong>。这正是参数化设计的价值：写一次，用 N 次。</p>
        `,
        codeExamples: [
          {
            caption: '参数化的 N 位加法器（可综合）',
            code: `module adder #(parameter WIDTH = 8) (
    input  [WIDTH-1:0] a, b,
    output [WIDTH-1:0] sum
);
    assign sum = a + b;
endmodule

// 例化时按需覆盖参数：
adder #(.WIDTH(16)) u_adder16 (.a(a16), .b(b16), .sum(s16));
adder #(.WIDTH(32)) u_adder32 (.a(a32), .b(b32), .sum(s32));`,
          },
          {
            caption: '参数化的分频器：同一模块、不同分频比',
            code: `// 分频比 = DIVISOR * 2
module clk_div #(parameter DIVISOR = 2) (
    input clk, rst_n,
    output reg div
);
    reg [3:0] cnt;
    always @(posedge clk or negedge rst_n)
        if (!rst_n) begin cnt <= 0; div <= 0; end
        else if (cnt == DIVISOR - 1) begin cnt <= 0; div <= ~div; end
        else cnt <= cnt + 1'b1;
endmodule

clk_div #(.DIVISOR(2)) u_div2 (...);  // 4 分频
clk_div #(.DIVISOR(3)) u_div3 (...);  // 6 分频`,
          },
          {
            caption: '老式 defparam（不推荐，仅了解）',
            code: `// 例化后单独指定参数
clk_div u_div2 (...);
defparam u_div2.DIVISOR = 2;   // 散落在代码里，难维护`,
          },
        ],
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：同一模块、两个实例（4 分频 vs 6 分频）',
              duration: 60,
              signals: ['clk', 'rst_n', 'cnt_a', 'div_a', 'cnt_b', 'div_b'],
              initialCode: `// 同一个 clk_div 模块的两个"实例"：参数不同 → 行为不同
reg clk, rst_n;
reg [3:0] cnt_a; reg div_a;   // 实例 A：DIVISOR=2 → 4 分频
reg [3:0] cnt_b; reg div_b;   // 实例 B：DIVISOR=3 → 6 分频
always #5 clk = ~clk;
// ---- 实例 A：数到 1 翻转 ----
always @(posedge clk or negedge rst_n) begin
  if (!rst_n) begin cnt_a <= 0; div_a <= 0; end
  else if (cnt_a == 4'd1) begin cnt_a <= 0; div_a <= ~div_a; end
  else cnt_a <= cnt_a + 1'b1;
end
// ---- 实例 B：数到 2 翻转 ----
always @(posedge clk or negedge rst_n) begin
  if (!rst_n) begin cnt_b <= 0; div_b <= 0; end
  else if (cnt_b == 4'd2) begin cnt_b <= 0; div_b <= ~div_b; end
  else cnt_b <= cnt_b + 1'b1;
end
initial begin
  rst_n = 0;
  #7 rst_n = 1;
end`,
              caption: '看波形：div_a 每 20ns 翻转（4 分频），div_b 每 30ns 翻转（6 分频）——两段代码结构完全相同，只有"数到几翻转"这个参数不同。这正是模块复用 + 参数化的实战意义。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: 'parameter 的作用是什么？',
              options: ['定义端口', '让模块可配置、可复用', '加快仿真', '定义变量类型'],
              answer: '让模块可配置、可复用',
              explanation: 'parameter 把位宽、分频系数等可变量写成参数，例化时用 #(.参数(值)) 覆盖，一个模块定义通吃多种场景。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: '例化时覆盖参数，推荐写法是？',
              options: ['defparam', '#(.WIDTH(16))', 'assign', 'inout'],
              answer: '#(.WIDTH(16))',
              explanation: '#() 内联传参在例化时直接指定参数值，清晰且推荐。defparam 是旧写法，容易出错不推荐。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '仿真器里 div_b 为什么比 div_a 翻转得慢？',
              options: ['仿真器 bug', '实例 B 数到 2 才翻转，数到 1 就翻转', '实例 B 更耗资源', '没有复位'],
              answer: '实例 B 数到 2 才翻转，数到 1 就翻转',
              explanation: '两个实例的代码结构完全相同，唯一差别是翻转阈值：A 数到 1（4 分频）、B 数到 2（6 分频），参数决定了行为差异。',
            },
          ],
        },
        fillBlank: {
          questions: [
            {
              id: 'fb1',
              prompt: '参数化的模块用 ___ 关键字声明参数，例化时用 ___ 覆盖。',
              answer: 'parameter, #()',
              accept: ['parameter，#()', 'parameter,#(.参数(值))', 'parameter，#(.参数(值))'],
              explanation: '用 parameter 声明带默认值的参数，例化时用 #(.参数(值)) 内联覆盖。',
            },
          ],
        },
      },
    ],
  },
  // ==================== 第6章 进阶知识 ====================
  {
    id: 'ch06-advanced',
    title: '进阶知识',
    description: '把前 5 章学的东西组合成真实工程能力：用函数/任务封装逻辑、画出并写出状态机、识别竞争冒险与 Latch 陷阱、写出像样的 testbench、理解流水线为什么能让芯片更快',
    lessons: [
      {
        id: 'ch06-l01',
        title: '函数 function：组合逻辑的"命名工具"',
        type: 'article',
        estimatedMinutes: 15,
        content: `
<h2>场景：同样的组合逻辑，用了几十次</h2>
<p>假设你要在几十个地方都算"两个数谁大"。每次都复制一遍 if-else 太笨了——<strong>函数 function</strong> 就是为此而生：把一段<strong>组合逻辑</strong>起个名字、封起来，之后一行调用。函数最终会<strong>展开成真实组合电路</strong>，所以可综合。</p>

<h2>函数的语法规则</h2>
<ul>
  <li>有多个输入，但<strong>只有一个返回值</strong>（函数名本身就是返回值）</li>
  <li>不能包含时序控制（#、@、wait）</li>
  <li>零时间执行（仿真视角），不能调用 task，可调用其他 function</li>
  <li>在表达式中调用，像用 <code>+</code> 一样：<code>assign r = max(a, b);</code></li>
</ul>

<h2>本课仿真器</h2>
<p>本节仿真器把 max 函数"展开"后的真实电路画了出来——你会发现它就是一个比较器加选择器。函数写起来像调用，综合出来就是这个。</p>
        `,
        codeExamples: [
          {
            caption: '函数示例 — 求两个数的最大值',
            code: `function [7:0] max;
    input [7:0] a, b;
    begin
        if (a > b)
            max = a;
        else
            max = b;
    end
endfunction

// 调用（就像用 + 号一样）
assign result = max(data1, data2);`,
          },
          {
            caption: '函数示例 — 奇偶校验（真实通信场景）',
            code: `// 8 位数据的偶校验位
function parity;
    input [7:0] data;
    integer i;
    begin
        parity = 0;
        for (i = 0; i < 8; i = i + 1)
            parity = parity ^ data[i];
    end
endfunction

assign even_bit = parity(tx_data);   // 发送端算校验位`,
          },
        ],
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：max 函数展开后的真实电路',
              duration: 20,
              signals: ['a', 'b', 'result'],
              initialCode: `// max(a,b) 展开 = 比较 + 选择
reg [7:0] a, b;
reg [7:0] result;
always @(*) begin
  if (a > b) result = a;
  else       result = b;
end
initial begin
  a = 8'd5;  b = 8'd9;   // max=9
  #5 a = 8'd20;          // max=20
  #5 b = 8'd7;           // max=20
end`,
              caption: '看波形：result 始终等于 a、b 中较大者。这就是函数综合出来的电路——一个比较器接一个选择器。函数只是给这段逻辑起了个名字。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: '函数 function 最多能有几个返回值？',
              options: ['多个', '一个', '两个', '不限'],
              answer: '一个',
              explanation: '函数只有一个返回值，就是函数名本身。需要多个输出时改用 task。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: '函数里能否出现 #10 这样的时序控制？',
              options: ['能', '不能', '看情况', '仿真时可以'],
              answer: '不能',
              explanation: '函数在零时间内执行，是纯组合逻辑，不能包含 #、@、wait 等时序控制。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '仿真器里 max 函数展开后等价于什么电路？',
              options: ['加法器', '比较器 + 选择器', '计数器', '锁存器'],
              answer: '比较器 + 选择器',
              explanation: 'if (a>b) 综合成比较器，两个分支输出综合成选择器。函数只是这段组合逻辑的"命名"。',
            },
          ],
        },
      },
      {
        id: 'ch06-l02',
        title: '任务 task：testbench 里的"宏命令"',
        type: 'article',
        estimatedMinutes: 15,
        content: `
<h2>场景：每次写寄存器都要敲一遍这段时序</h2>
<p>配置芯片时，经常要往寄存器写数据：放地址 → 放数据 → 拉片选 → 拉写使能 → 释放。如果每个寄存器都敲一遍这段 <code>#时延</code>，testbench 会又长又乱。<strong>任务 task</strong> 就是把一段<strong>含时序的激励</strong>封装起来，起个名字，之后一行调用。</p>

<h2>task 与 function 的关键区别</h2>
<ul>
  <li>task 可以有<strong>多个输入输出</strong>，function 只能一个返回值</li>
  <li>task 可以含 <code>#</code>、<code>@</code>、<code>wait</code>，function 不行</li>
  <li>task <strong>作为独立语句</strong>调用，function 在表达式中调用</li>
  <li>含时序控制的 task <strong>不可综合</strong>，只在 testbench 用</li>
</ul>

<h2>本课仿真器</h2>
<p>本节仿真器演示"写寄存器"总线时序：cs_n（片选）、we_n（写使能）先高后低的握手过程。真实工程里这段时序会被写成一个 task，testbench 里一行 <code>write_reg(addr, data)</code> 就能复现。</p>
        `,
        codeExamples: [
          {
            caption: '写寄存器 task（真实总线场景）',
            code: `// 写寄存器：addr 放地址、data 放数据，拉低 CS/WE 写入
task write_reg;
    input [3:0] addr, data;
    begin
        addr_o = addr;     // 放地址
        #10;
        data_o = data;     // 放数据
        #10;
        cs_n = 0;          // 片选拉低
        #5;
        we_n = 0;          // 写使能拉低 → 锁存数据
        #5;
        we_n = 1;          // 释放
        #5;
        cs_n = 1;
    end
endtask`,
          },
          {
            caption: 'task 作为独立语句调用',
            code: `// 在 initial 里逐条调用
initial begin
    write_reg(4'h3, 4'hA);   // 写寄存器 3 ← A
    write_reg(4'h4, 4'h5);   // 写寄存器 4 ← 5
end`,
          },
        ],
        compareTable: {
          title: 'task 与 function 对比',
          headers: ['特性', 'function', 'task'],
          rows: [
            ['输入输出', '多个输入，单个输出', '多个输入、输出、双向端口'],
            ['时序控制', '不能包含', '可以包含 #、@、wait'],
            ['调用其他', '只能调用 function', '可调用 task 和 function'],
            ['综合', '可综合', '含时序控制时不可综合'],
            ['调用方式', '作为表达式的一部分', '作为独立语句'],
          ],
        },
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：写寄存器总线时序',
              duration: 50,
              signals: ['cs_n', 'we_n', 'addr', 'wdata'],
              initialCode: `// write_reg(addr, data) 展开的时序：
// 放地址 → 放数据 → 拉 CS → 拉 WE → 释放
reg cs_n, we_n;
reg [3:0] addr, wdata;
initial begin
  cs_n = 1; we_n = 1; addr = 0; wdata = 0;
  #10 addr  = 4'd3;     // 放地址 3
  #10 wdata = 4'hA;     // 放数据 A
  #5  cs_n  = 0;        // 片选拉低
  #5  we_n  = 0;        // 写使能拉低 → 此刻写入
  #5  we_n  = 1;        // 释放
  #5  cs_n  = 1;        // 释放片选
end`,
              caption: '看波形：addr 先就绪，数据就绪后 CS/WE 依次拉低形成"写握手"，再依次释放。这段时序写成一个 task 后，testbench 一行调用就能复现，代码干净得多。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: 'task 与 function 最核心的区别是？',
              options: ['task 更快', 'task 可以含时序控制且可有多个输出', 'function 不可综合', 'task 只能有一个输入'],
              answer: 'task 可以含时序控制且可有多个输出',
              explanation: 'task 支持多个输入输出和 #/@/wait 时序控制，function 单输出且零时间执行。所以 task 多用于 testbench 激励。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: '含时序控制的 task 能否综合成硬件？',
              options: ['能', '不能', '看位宽', '一定能'],
              answer: '不能',
              explanation: '含 #/@/wait 的 task 只在仿真中执行，没有对应硬件，不可综合。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '仿真器里写使能 we_n 在哪一刻拉低？',
              options: ['一开始', '放地址后 20ns', '放数据后 10ns', '从不拉低'],
              answer: '放数据后 10ns',
              explanation: '地址 10ns 就绪、数据 20ns 就绪，随后 cs_n 25ns 拉低、we_n 30ns 拉低形成写握手。',
            },
          ],
        },
      },
      {
        id: 'ch06-l03',
        title: '状态机 FSM：把"流程"变成硬件',
        type: 'article',
        estimatedMinutes: 25,
        content: `
<h2>场景：硬件也要"分几步走"</h2>
<p>有些逻辑不是算数，而是<strong>按流程办事</strong>：自动售卖机收钱出货、UART 按帧收发、CPU 取指译码执行。这种"当前处于哪一步 + 下一步去哪"的逻辑，就是<strong>有限状态机 FSM</strong>——数字设计里最重要、最常用的设计模式。</p>

<h2>第一步永远是画图，不是写代码</h2>
<p>工业界铁律：<strong>先画状态转移图</strong>，标注每个状态、转移条件和输出信号；代码只是图纸的翻译。本节交互演示就是一个自动售卖机：投 0.5 元或 1 元硬币，凑满 1.5 元出货。点击按钮，亲自走一遍状态转移。</p>

<h2>Moore 型 vs Mealy 型</h2>
<ul>
  <li><strong>Moore 型</strong>：输出只由<strong>当前状态</strong>决定，稳定、无毛刺，但响应慢一拍</li>
  <li><strong>Mealy 型</strong>：输出由<strong>当前状态 + 当前输入</strong>决定，响应快，但输出可能随输入抖动</li>
</ul>

<h2>三段式状态机（业界推荐）</h2>
<ol>
  <li><strong>第一段</strong>（时序，<code>always @(posedge clk)</code>）：状态寄存器 <code>st_cur &lt;= st_next</code></li>
  <li><strong>第二段</strong>（组合，<code>always @(*)</code>）：根据当前状态和输入算<strong>下一状态</strong></li>
  <li><strong>第三段</strong>（时序）：根据状态算<strong>输出</strong></li>
</ol>
<p>三段分离，改状态表不动输出逻辑、改输出不动状态表，维护成本最低。</p>
        `,
        codeExamples: [
          {
            caption: '三段式状态机：101 序列检测器（完整可综合）',
            code: `// 检测输入流里是否出现 "101"，输出 det 拉高一拍
// 状态：S0=啥也没匹配，S1=匹配了1，S2=匹配了10，S3=匹配了101
parameter S0 = 2'b00, S1 = 2'b01, S2 = 2'b10, S3 = 2'b11;

// (1) 状态寄存器
always @(posedge clk or negedge rst_n) begin
    if (!rst_n) st_cur <= S0;
    else        st_cur <= st_next;
end

// (2) 下一状态逻辑（组合）——把状态转移图画成代码
always @(*) begin
    case (st_cur)
        S0: st_next = din ? S1 : S0;   // 见到 1 → 前进
        S1: st_next = din ? S1 : S2;   // 已见 1，再见 0 → 前进
        S2: st_next = din ? S3 : S0;   // 已见 10，再见 1 → 命中
        S3: st_next = din ? S1 : S2;   // 重叠匹配：1 作为新起点
        default: st_next = S0;
    endcase
end

// (3) 输出逻辑：命中 S3 即 det=1
assign det = (st_cur == S3);`,
          },
          {
            caption: '三段式状态机：自动售卖机（业界写法）',
            code: `parameter IDLE=0, GET05=1, GET10=2, GET15=3;
// (1) 状态寄存器
always @(posedge clk or negedge rstn) begin
    if (!rstn) st_cur <= IDLE;
    else       st_cur <= st_next;
end
// (2) 下一状态逻辑（组合）
always @(*) begin
    case(st_cur)
        IDLE:   st_next = (coin==2'b01) ? GET05 : (coin==2'b10) ? GET10 : IDLE;
        GET05:  st_next = (coin==2'b01) ? GET10 : (coin==2'b10) ? GET15 : GET05;
        GET10:  st_next = (coin==2'b01) ? GET15 : (coin==2'b10) ? IDLE  : GET10;
        GET15:  st_next = IDLE;
        default: st_next = IDLE;
    endcase
end
// (3) 输出逻辑（时序）
always @(posedge clk or negedge rstn) begin
    if (!rstn) begin sell <= 0; change <= 0; end
    else if ((st_cur==GET15 && coin==2'b01) ||
             (st_cur==GET10 && coin==2'b10)) begin
        sell <= 1; change <= 0;      // 出货，不找零
    end
    else if (st_cur==GET15 && coin==2'b10) begin
        sell <= 1; change <= 1;      // 出货 + 找零 0.5 元
    end
    else begin sell <= 0; change <= 0; end
end`,
          },
        ],
        visuals: [
          {
            type: 'fsm',
            props: {
              title: '自动售卖机 — 状态机演示',
              states: [
                { id: 'IDLE', label: 'IDLE', x: 105, y: 255, amount: '0.0 元' },
                { id: 'GET05', label: 'GET05', x: 235, y: 105, amount: '0.5 元' },
                { id: 'GET10', label: 'GET10', x: 395, y: 105, amount: '1.0 元' },
                { id: 'GET15', label: 'GET15', x: 510, y: 255, amount: '1.5 元' },
              ],
              transitions: [
                { from: 'IDLE', to: 'GET05', label: 'c05', outputs: {} },
                { from: 'IDLE', to: 'GET10', label: 'c10', outputs: {} },
                { from: 'GET05', to: 'GET10', label: 'c05', outputs: {} },
                { from: 'GET05', to: 'GET15', label: 'c10', outputs: {} },
                { from: 'GET10', to: 'GET15', label: 'c05', outputs: {} },
                { from: 'GET10', to: 'IDLE', label: 'c10', outputs: { sell: '1' } },
                { from: 'GET15', to: 'IDLE', label: 'c05', outputs: { sell: '1' } },
                { from: 'GET15', to: 'IDLE', label: 'c10', outputs: { sell: '1', change: '1' } },
              ],
              inputs: [
                { label: '投币 0.5 元', id: 'c05', hint: 'coin = 2\'b01' },
                { label: '投币 1 元', id: 'c10', hint: 'coin = 2\'b10' },
              ],
              outputs: [
                { id: 'sell', label: 'sell 出货', desc: '投入金额 ≥ 1.5 元' },
                { id: 'change', label: 'change 找零', desc: '多投 0.5 元时找零' },
              ],
              initial: 'IDLE',
              next: (state: string, inputId: string): { state: string; outputs: Record<string, string> } => {
                if (state === 'IDLE') return { state: inputId === 'c05' ? 'GET05' : 'GET10', outputs: {} }
                if (state === 'GET05') return { state: inputId === 'c05' ? 'GET10' : 'GET15', outputs: {} }
                if (state === 'GET10') {
                  if (inputId === 'c05') return { state: 'GET15', outputs: {} }
                  return { state: 'IDLE', outputs: { sell: '1' } }
                }
                // GET15
                if (inputId === 'c10') return { state: 'IDLE', outputs: { sell: '1', change: '1' } }
                return { state: 'IDLE', outputs: { sell: '1' } }
              },
              caption: '点击"投币"按钮驱动状态转移，对应三段式状态机代码。凑满 1.5 元出货 sell=1；若在 1.5 元时再投 1 元，则出货同时找零 change=1（0.5 元）。',
            },
          },
          {
            type: 'sim',
            props: {
              title: '在线仿真：101 序列检测器（看状态跳转）',
              duration: 75,
              signals: ['clk', 'rst_n', 'din', 'st', 'det'],
              initialCode: `// 101 序列检测器：输入流里出现 "101" 时 det 拉高一拍
// 状态：0=S0 1=S1 2=S2 3=S3
reg clk, din, det;
reg [1:0] st;
reg rst_n;
always #5 clk = ~clk;
always @(posedge clk or negedge rst_n) begin
  if (!rst_n) st <= 2'd0;
  else if (st == 2'd0) begin
    if (din) st <= 2'd1; else st <= 2'd0;
  end
  else if (st == 2'd1) begin
    if (din) st <= 2'd1; else st <= 2'd2;
  end
  else if (st == 2'd2) begin
    if (din) st <= 2'd3; else st <= 2'd0;
  end
  else begin
    if (din) st <= 2'd1; else st <= 2'd2;
  end
end
assign det = (st == 2'd3);
initial begin
  rst_n = 0; din = 0;
  #6 rst_n = 1;
  // 输入流：1 0 1 0 1 0（每个时钟放一位）
  #10 din = 1;
  #10 din = 0;
  #10 din = 1;   // 至此 "101" 命中
  #10 din = 0;
  #10 din = 1;   // 再次命中（重叠）
  #10 din = 0;
end`,
              caption: '看波形：输入流 1→0→1 后，st 依次 1→2→3，det 在第 4 拍拉高——"101"被检出。之后 0→1 又命中一次，这就是状态机的"重叠匹配"。试着改一个转移条件，看检出位置怎么变。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: '三段式状态机的第二段应该使用什么类型的 always 块？',
              options: ['always @(posedge clk)', 'always @(*)', 'always @(negedge clk)', 'initial'],
              answer: 'always @(*)',
              explanation: '第二段是组合逻辑，用于计算下一状态，应使用 always @(*)（电平敏感）。第一段和第三段是时序逻辑，使用 always @(posedge clk)。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: 'Moore 型和 Mealy 型状态机的主要区别是什么？',
              options: ['Moore 型更快', 'Mealy 型的输出与输入有关，Moore 型只与状态有关', '没有区别', 'Moore 型更省面积'],
              answer: 'Mealy 型的输出与输入有关，Moore 型只与状态有关',
              explanation: 'Moore 型输出只取决于当前状态；Mealy 型输出取决于当前状态和当前输入。所以 Mealy 型响应更快但可能产生输出毛刺。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '设计状态机时，第一步应该做什么？',
              options: ['直接写代码', '画出状态转移图', '先写 testbench', '定义参数'],
              answer: '画出状态转移图',
              explanation: '先画状态转移图，标清状态、转移条件和输出，代码只是图纸的翻译。直接写代码容易漏状态、漏转移。',
            },
          ],
        },
      },
      {
        id: 'ch06-l04',
        title: '竞争与冒险：组合逻辑的"毛刺"从哪来',
        type: 'article',
        estimatedMinutes: 15,
        content: `
<h2>现象：输出本来该保持 1，却闪了一下 0</h2>
<p>组合逻辑里的信号走不同的路径，<strong>路径延迟不同</strong>，到达同一扇门的时间就有先后——这叫<strong>竞争</strong>。竞争造成的瞬间错误输出（一个窄毛刺）叫<strong>冒险</strong>。本节波形里：A 从 1 变 0 时，理想输出 F 该保持 1，实际却闪出一个极窄的 0——这就是毛刺。</p>

<h2>为什么会毛刺（经典例子）</h2>
<pre><code>assign F = A & B | ~A & C;   // F = A·B + A'·C</code></pre>
<p>当 <code>B=1、C=1</code> 且 <code>A</code> 由 1 变 0：A·B 这一项先失效，而 ~A·C 这一项要等反相器延迟后才生效——<strong>两项同时为 0 的瞬间</strong>，F 就冒出毛刺。</p>

<h2>消除毛刺的三个成熟手段</h2>
<ul>
  <li><strong>输出寄存</strong>：在输出端加一级触发器，用时钟采样——最常用、最彻底</li>
  <li><strong>增加冗余项</strong>：加一个不受 A 影响的乘积项 <code>A·C</code>，把缺口填上</li>
  <li><strong>选通采样</strong>：等信号稳定后再使能采样</li>
</ul>
        `,
        codeExamples: [
          {
            caption: '有冒险的写法（B、C 恒 1，A 翻转时 F 闪 0）',
            code: `// F = A·B + A'·C，B=1、C=1 时 A 翻转会毛刺
assign F = (A & B) | (~A & C);`,
          },
          {
            caption: '修复 1：增加冗余项（卡诺图法）',
            code: `// 加一项 A·C：三个乘积项两两有公共因子，消除冒险
assign F = (A & B) | (~A & C) | (B & C);`,
          },
          {
            caption: '修复 2：输出寄存（最常用、最彻底）',
            code: `// 组合输出过一级触发器，毛刺被时钟滤掉
always @(posedge clk) begin
    F_reg <= (A & B) | (~A & C);
end`,
          },
        ],
        visuals: [
          {
            type: 'wave',
            props: {
              title: '竞争冒险：理想输出 vs 实际输出的毛刺',
              signals: [
                { name: 'A', edges: [[0, '1'], [15, '0']] },
                { name: 'B', edges: [[0, '1']] },
                { name: 'C', edges: [[0, '1']] },
                { name: 'F(理想)', edges: [[0, '1']] },
                { name: 'F(实际)', edges: [[0, '1'], [15, '0'], [16, '1']] },
              ],
              duration: 30,
              step: 2,
              caption: 'A 在 t=15 由 1 变 0 时，理想 F 保持 1，但实际 F 在 t=15~16 闪出一个 0 毛刺（因为 A·B 项先失效、A\'·C 项后生效）。加冗余项或输出寄存可消除。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: '竞争与冒险的关系是？',
              options: ['两者无关', '竞争导致冒险（毛刺）', '冒险导致竞争', '同一个东西'],
              answer: '竞争导致冒险（毛刺）',
              explanation: '路径延迟不同形成竞争，竞争导致输出瞬间出现错误值（毛刺），即冒险。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: '消除毛刺最常用的方法是？',
              options: ['加大电压', '输出端加寄存器', '加长走线', '降低频率'],
              answer: '输出端加寄存器',
              explanation: '在组合输出端加一级触发器，用时钟采样，毛刺被滤掉——这是最常用、最彻底的办法。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '波形里 F(实际) 为什么闪出 0 毛刺？',
              options: ['信号抖动', 'A·B 先失效、A\'·C 后生效，两项同时为 0', '仿真器 bug', 'B 变化了'],
              answer: 'A·B 先失效、A\'·C 后生效，两项同时为 0',
              explanation: 'A 翻转时，A·B 项先归零，而 ~A·C 项要等反相器延迟才生效，瞬间两项都为 0，F 冒出毛刺。',
            },
          ],
        },
      },
      {
        id: 'ch06-l05',
        title: '避免 Latch：组合逻辑的"保持"陷阱',
        type: 'article',
        estimatedMinutes: 15,
        content: `
<h2>锁存器 Latch 为什么是"陷阱"</h2>
<p>FPGA 里<strong>时序逻辑用触发器</strong>（边沿触发），而 Latch 是<strong>电平敏感</strong>的锁存器。综合工具在你的组合逻辑里"偷偷"生成 Latch 通常意味着代码有漏洞，因为它：</p>
<ul>
  <li>对毛刺敏感（电平敏感，毛刺直接透传）</li>
  <li>时序分析困难，容易导致时序违例</li>
  <li>在 FPGA 架构上资源利用率差</li>
</ul>

<h2>用仿真器亲自"看见"Latch 行为</h2>
<p>先运行<strong>第一个仿真器</strong>：组合 always 里 <code>if (en) out = data;</code> 没写 else——注意当 <code>en=0</code> 后 out 是什么表现？再运行<strong>第二个</strong>（补了 else）对比。差别一目了然。</p>
        `,
        compareTable: {
          title: '产生 Latch 的场景与修复',
          headers: ['场景', '问题代码', '修复方案'],
          rows: [
            ['组合逻辑 if 缺少 else', 'if (en) out = data;', 'if (en) out = data; else out = 0;'],
            ['case 缺少 default', 'case(sel) 2\'b00: out=a; ...', '加 default: out = 0;'],
            ['信号在部分分支未赋值', 'if (a) out=b; // 其他分支未写', '所有分支都给 out 赋值'],
          ],
        },
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：缺 else —— en 拉低后 out 被"锁住"',
              duration: 25,
              signals: ['en', 'data', 'out'],
              initialCode: `// ⚠️ 缺 else：en=0 时 out 保持旧值 → 综合出 Latch
reg en, data;
reg [3:0] out;
always @(*) begin
  if (en) out = data;
end
initial begin
  en = 0; data = 0; out = 0;
  #5 data = 1;      // en=0：不跟随
  #5 en = 1;        // out 跟随 data → 1
  #5 en = 0;        // en 拉低，data 仍 1：out 保持 1！
  #5 data = 0;      // data 已变 0，但 out 仍保持 1
end`,
              caption: '看波形：en=0 后，即使 data 变化，out 也死死保持上次的值 1——这就是 Latch 的"锁存"行为。综合工具只能用电平敏感的锁存器实现它。',
            },
          },
          {
            type: 'sim',
            props: {
              title: '在线仿真：补 else —— en=0 时 out 立即清零（纯组合）',
              duration: 25,
              signals: ['en', 'data', 'out'],
              initialCode: `// ✅ 补 else：所有条件都覆盖 → 纯组合电路
reg en, data;
reg [3:0] out;
always @(*) begin
  if (en) out = data;
  else    out = 0;
end
initial begin
  en = 0; data = 0; out = 0;
  #5 data = 1;      // en=0：else 清零 → out=0
  #5 en = 1;        // out 跟随 data → 1
  #5 en = 0;        // en 拉低 → out 直接清零！
  #5 data = 0;      // 保持 0
end`,
              caption: '对比上一个：这里 en=0 时 out 立即归 0，不"锁存"。每个输入组合都有明确输出，综合出的是纯组合逻辑（多路选择器），不会生成 Latch。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: '组合逻辑中 if 缺 else 为什么会产生 Latch？',
              options: ['语法错误', '条件不满足时输出要保持旧值，只能用电平敏感的锁存器实现', '工具自动优化', '位宽问题'],
              answer: '条件不满足时输出要保持旧值，只能用电平敏感的锁存器实现',
              explanation: '当 else 分支没写、条件又不满足时，输出没有明确赋值，就只能"保持旧值"，综合工具被迫生成电平敏感的 Latch。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: '两个仿真器对比，缺 else 版本的 out 在 en=0 后有什么表现？',
              options: ['立即清零', '保持旧值 1 不动', '变成 x', '跟随 data'],
              answer: '保持旧值 1 不动',
              explanation: '缺 else 版本在 en=0 后 out 保持上次的 1 不变（Latch 行为）；补 else 版本 en=0 时立即清零（纯组合）。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '避免 Latch 的核心原则是？',
              options: ['减少 always 块', '组合逻辑覆盖所有输入分支，给每个输出明确赋值', '多用 wire', '提高频率'],
              answer: '组合逻辑覆盖所有输入分支，给每个输出明确赋值',
              explanation: '让每个输出在组合逻辑的所有可能条件下都有赋值（if 补 else、case 补 default），就不会生成 Latch。',
            },
          ],
        },
      },
      {
        id: 'ch06-l06',
        title: '仿真激励 Testbench：逼真的"测试台"',
        type: 'article',
        estimatedMinutes: 20,
        content: `
<h2>Testbench 是验证设计的"标准做法"</h2>
<p>写完一个模块，怎么知道它对不对？把模块当成"被测对象 DUT"装进一个专门的测试环境，给它喂激励、看它输出——这个环境就是<strong>testbench（测试台）</strong>。它是验证工程师天天写的代码。</p>
<ul>
  <li>产生激励：时钟、复位、输入数据</li>
  <li>例化被测模块 DUT 并连上信号</li>
  <li>用 <code>$display</code>/<code>$monitor</code> 打印、<code>$finish</code> 结束仿真</li>
  <li><strong>没有端口列表</strong>，本身就是顶层；<strong>不可综合</strong>，只在仿真器里跑</li>
</ul>

<h2>Testbench 的五个步骤</h2>
<ol>
  <li><strong>信号声明</strong>：驱动 DUT 的用 reg，接收 DUT 输出的用 wire</li>
  <li><strong>DUT 例化</strong>：把信号连到被测模块端口</li>
  <li><strong>时钟产生</strong>：<code>always #5 clk = ~clk;</code> 最常用</li>
  <li><strong>激励产生</strong>：initial 块里按时间点给信号赋值</li>
  <li><strong>结果检查</strong>：<code>$display</code> 打印 + 人工/自动比对</li>
</ol>

<h2>本课仿真器</h2>
<p>本节仿真器就是"testbench 驱动一个小 DUT"的缩影：testbench 按时间点喂 <code>a</code>/<code>b</code>，被测加法器 DUT 每个时钟沿把和 <code>sum</code> 算出来。看 DUT 如何跟着激励走——这就是验证的最基本形态。</p>
        `,
        codeExamples: [
          {
            caption: '完整 Testbench 结构（含自检测）',
            code: `\`timescale 1ns/1ns

module testbench;  // 没有端口列表！
    // 1. 信号声明
    reg  clk, rst_n;
    reg  [3:0] a, b;
    wire [4:0] sum;

    // 2. DUT 例化
    adder_4bit u_dut (.a(a), .b(b), .sum(sum));

    // 3. 时钟产生：100MHz
    initial clk = 0;
    always #5 clk = ~clk;

    // 4. 激励产生
    initial begin
        rst_n = 0; a = 0; b = 0;
        #20 rst_n = 1;
        #10 a = 4'd10; b = 4'd5;    // 期望 sum=15
        #10 a = 4'd7;  b = 4'd8;    // 期望 sum=15
        #10 a = 4'd15; b = 4'd1;    // 期望 sum=16
        #50 $finish;
    end

    // 5. 结果检查（自检测）
    always @(posedge clk)
        $display("t=%0t a=%d b=%d sum=%d", $time, a, b, sum);
endmodule`,
          },
          {
            caption: '$monitor：信号一变就打印一行',
            code: `// 只要 a/b/sum 任一变化就打印，适合调试
initial $monitor("t=%0t a=%b b=%b sum=%b", $time, a, b, sum);`,
          },
        ],
        visuals: [
          {
            type: 'sim',
            props: {
              title: '在线仿真：testbench 驱动 DUT（带寄存输出的加法器）',
              duration: 45,
              signals: ['clk', 'rst_n', 'a', 'b', 'sum'],
              initialCode: `// DUT：带寄存输出的 8 位加法器，testbench 喂数据
reg clk, rst_n;
reg [7:0] a, b;
reg [7:0] sum;
always #5 clk = ~clk;
always @(posedge clk or negedge rst_n) begin
  if (!rst_n) sum <= 8'd0;
  else        sum <= a + b;   // 每个时钟沿算一次
end
// ---- testbench：按时间点喂激励 ----
initial begin
  rst_n = 0; a = 0; b = 0;
  #7  rst_n = 1;                 // 复位释放
  #10 a = 8'd10; b = 8'd5;       // sum → 15
  #10 a = 8'd100; b = 8'd27;     // sum → 127
  #10 a = 8'd200; b = 8'd55;     // sum → 255
end`,
              caption: '看波形：复位释放后，testbench 每 10ns 换一组 a/b，DUT 在每个时钟沿更新 sum = a+b。这就是"激励 → DUT → 输出"验证流程的最小模型。把 a+b 换成真实模块的运算，就是你的第一个 testbench。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: 'testbench 模块需要有端口列表吗？',
              options: ['需要', '不需要，它本身就是顶层', '必须有 input', '必须有 output'],
              answer: '不需要，它本身就是顶层',
              explanation: 'testbench 是仿真顶层，没有人例化它，所以不需要端口列表。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: 'testbench 里驱动 DUT 输入的信号，用什么类型？',
              options: ['wire', 'reg', 'inout', 'parameter'],
              answer: 'reg',
              explanation: '驱动 DUT 输入的激励信号由 initial/always 赋值，必须是 reg；接收 DUT 输出的用 wire。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '$display 在 testbench 里的作用是？',
              options: ['产生时钟', '打印调试信息', '结束仿真', '综合成硬件'],
              answer: '打印调试信息',
              explanation: '$display 在仿真时间点打印一行文本，用于结果检查和调试。$finish 才结束仿真。',
            },
          ],
        },
      },
      {
        id: 'ch06-l07',
        title: '流水线：用延迟换吞吐量',
        type: 'article',
        estimatedMinutes: 20,
        content: `
<h2>为什么芯片要"分工流水线"</h2>
<p>一个组合运算（比如乘法再加法）延迟太长，时钟频率就被它卡死。<strong>流水线</strong>把长路径<strong>切分成几段，段与段之间插触发器</strong>：每段都变短，时钟就能跑更快。代价是数据从进到出要多等几拍（延迟 latency 增加），但<strong>每个时钟都能处理一个新数据</strong>——吞吐量上去了。</p>
<ul>
  <li><strong>收益</strong>：关键路径变短 → 时钟频率提高 → 每拍一个新结果</li>
  <li><strong>代价</strong>：latency 增加（多了几拍）、寄存器面积增加</li>
</ul>

<h2>把 a*b+c 拆成两级</h2>
<p>乘法是大块头。把它单独放一级（Stage1），加法放下一级（Stage2），中间插寄存器。本节仿真器就是这段代码——注意 <code>out</code> 的每个结果都<strong>比输入晚了 2 拍</strong>，但每一拍 out 都在出新值。</p>
        `,
        codeExamples: [
          {
            caption: '2 级流水线：乘法 → 加法（c 与乘积对齐寄存）',
            code: `reg [15:0] m;
reg [7:0]  c_r;         // c 也要寄存一拍，和乘积对齐
reg [15:0] out;
always @(posedge clk) begin
    c_r <= c;            // 对齐
    m   <= a * b;        // Stage1：乘法
    out <= m + c_r;      // Stage2：加法
end
// 结果比输入晚 2 拍，但每拍都能进新数据`,
          },
          {
            caption: '不切流水线 vs 3 级更深流水线',
            code: `// 不切：一个周期里做完 a*b+c，关键路径最长
assign result = a * b + c;

// 3 级：乘法 → 加法 → 输出（更深，可再提频率）
reg [15:0] mult_result;
reg [15:0] add_result;
reg [15:0] pipe_out;
always @(posedge clk) begin
    mult_result <= a * b;            // Stage 1
    add_result  <= mult_result + c;  // Stage 2
    pipe_out    <= add_result;       // Stage 3
end`,
          },
        ],
        visuals: [
          {
            type: 'pipeline',
            props: {
              title: '流水线 — 数据逐拍推进',
              stages: ['Stage 1\n乘法', 'Stage 2\n加法', 'Stage 3\n输出'],
              sequence: ['d0', 'd1', 'd2', 'd3', 'd4'],
              caption: '每周期进入一个新数据包（吞吐量 = 1 数据/周期）。但第一个数据 d0 要经过多个时钟周期才能出现在输出端（延迟 latency > 0）。流水线用"延迟换取吞吐量"。',
            },
          },
          {
            type: 'sim',
            props: {
              title: '在线仿真：2 级流水线 a*b+c（结果晚 2 拍）',
              duration: 50,
              signals: ['clk', 'a', 'b', 'c', 'm', 'out'],
              initialCode: `// 2 级流水线：m 存乘积，out 存乘加结果
reg clk;
reg [7:0] a, b, c;
reg [15:0] m;
reg [7:0]  c_r;
reg [15:0] out;
always #5 clk = ~clk;
always @(posedge clk) begin
  c_r <= c;        // 对齐
  m   <= a * b;    // Stage1 乘法
  out <= m + c_r;  // Stage2 加法
end
initial begin
  a = 8'd2; b = 8'd3; c = 8'd1;  // 输入1：2*3+1=7
  #10 a = 8'd4; b = 8'd5; c = 8'd2;  // 输入2：4*5+2=22
  #10 a = 8'd1; b = 8'd1; c = 8'd0;  // 输入3：1*1+0=1
end`,
              caption: '看波形：out = 7（15ns）、22（25ns）、1（35ns）——每个输入的结果都晚了 2 拍才出现（latency=2），但每一拍 out 都在更新新数据（吞吐量=1/拍）。如果把乘法再拆一级，频率还能更高。',
            },
          },
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'single',
              stem: '流水线设计的主要代价是什么？',
              options: ['降低时钟频率', '增加延迟和寄存器面积', '减少吞吐量', '增加功耗但不提高性能'],
              answer: '增加延迟和寄存器面积',
              explanation: '流水线插入寄存器会增加数据从输入到输出的时钟周期数（延迟 latency），并需要额外寄存器资源（面积），但换来了更高的时钟频率和吞吐量。',
            },
            {
              id: 'q2',
              type: 'single',
              stem: '仿真器里 out 比输入晚了几拍？',
              options: ['0 拍', '1 拍', '2 拍', '3 拍'],
              answer: '2 拍',
              explanation: 'm 在 Stage1 寄存一拍、out 在 Stage2 再寄存一拍，共 2 拍延迟。7 在 15ns 出现，比输入（0ns）晚 2 个时钟周期。',
            },
            {
              id: 'q3',
              type: 'single',
              stem: '流水线提高吞吐量的本质是？',
              options: ['降低功耗', '缩短关键路径、提高时钟频率，每拍都能进新数据', '减少逻辑', '加快第一个数据'],
              answer: '缩短关键路径、提高时钟频率，每拍都能进新数据',
              explanation: '每段组合路径变短，时钟可以跑更快，于是每个时钟周期都能启动一个新运算，吞吐量 = 1 数据/拍。',
            },
          ],
        },
        fillBlank: {
          questions: [
            {
              id: 'fb1',
              prompt: '流水线用增加 ___（延迟）和 ___（寄存器资源）为代价，换取更高的 ___。',
              answer: 'latency, 面积, 吞吐量/频率',
              accept: ['延迟, 面积, 吞吐量', 'latency,面积,吞吐量', '延迟、面积、时钟频率'],
              explanation: '流水线在段间插入寄存器，增加延迟和面积，但缩短关键路径、提高时钟频率，从而提升吞吐量。',
            },
          ],
        },
      },
    ],
  },

]
