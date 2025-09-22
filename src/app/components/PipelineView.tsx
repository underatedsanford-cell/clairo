'use client';

import { motion, Variants } from 'framer-motion';

type PipelineStage = {
  name: string;
  count: number;
  value: number;
};

type PipelineViewProps = {
  stages: PipelineStage[];
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: 'easeOut',
    },
  }),
};

export default function PipelineView({ stages }: PipelineViewProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
      <h2 className="text-xl font-semibold text-purple-300 mb-4">Sales Pipeline</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stages.map((stage, i) => (
          <motion.div
            key={stage.name}
            className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col justify-between"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={i}
          >
            <div>
              <h3 className="font-bold text-lg text-gray-200">{stage.name}</h3>
              <p className="text-3xl font-bold text-purple-400">{stage.count}</p>
            </div>
            <div className="text-right mt-4">
              <p className="text-sm text-gray-400">Value</p>
              <p className="font-semibold text-green-400">${stage.value.toLocaleString()}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}