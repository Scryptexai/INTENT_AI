import React, { useState } from "react";
import { Loader2, Copy, Check } from "lucide-react";
import { generateContent, GeneratorType, GENERATOR_LABELS } from "@/services/workspaceGenerator";

interface TaskTemplateGeneratorProps {
  generatorType: GeneratorType;
  context: {
    niche: string;
    subSector: string;
    platform: string;
    economicModel: string;
    topic?: string;
    additionalContext?: string;
  };
}

const TaskTemplateGenerator: React.FC<TaskTemplateGeneratorProps> = ({ generatorType, context }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setResult("");
    const output = await generateContent({
      type: generatorType,
      ...context,
    });
    setResult(output.content);
    setLoading(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mt-3">
      <button
        className="cmd-primary text-xs"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : GENERATOR_LABELS[generatorType].label + " AI"}
      </button>
      {result && (
        <div className="mt-2 border border-border bg-muted/5 p-3 rounded">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground/40">Output</span>
            <button onClick={handleCopy} className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors">
              {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
            </button>
          </div>
          <div className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {result}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTemplateGenerator;
