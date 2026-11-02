import type { WavePlayerProps } from './WavePlayer'
import type { FSMVisualizerProps } from './FSMVisualizer'
import type { GatePropagationProps } from './GatePropagation'
import type { PipelineVisualizerProps } from './PipelineVisualizer'
import type { VerilogSimulatorProps } from './VerilogSimulator'

export { default as WavePlayer } from './WavePlayer'
export { default as FSMVisualizer } from './FSMVisualizer'
export { default as GatePropagation } from './GatePropagation'
export { default as PipelineVisualizer } from './PipelineVisualizer'
export { default as VerilogSimulator } from './VerilogSimulator'

export type VisualBlock =
  | { type: 'wave'; props: WavePlayerProps }
  | { type: 'fsm'; props: FSMVisualizerProps }
  | { type: 'gate'; props: GatePropagationProps }
  | { type: 'pipeline'; props: PipelineVisualizerProps }
  | { type: 'sim'; props: VerilogSimulatorProps }
