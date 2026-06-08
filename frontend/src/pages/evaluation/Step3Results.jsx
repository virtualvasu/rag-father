import React from 'react';

const Step3Results = ({ results }) => {
  return (
    <div className="border border-outline-variant rounded-none p-6 bg-surface-container">
      <h2 className="text-headline-md font-headline-md mb-4 text-secondary">3. Evaluation Results</h2>
      
      {results.length === 0 ? (
        <p className="text-sm font-mono text-on-surface-variant">No evaluation results found. Run an evaluation to see metrics here.</p>
      ) : (
        <div className="space-y-12">
          {results.map((run, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex justify-between items-end border-b border-outline-variant pb-2">
                <div>
                  <h3 className="font-mono text-lg text-primary font-bold">{run.filename}</h3>
                  <p className="text-xs font-mono text-on-surface-variant">Run Timestamp: {run.timestamp}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-on-surface-variant block">Questions Evaluated</span>
                  <span className="text-xl font-mono text-secondary">{run.num_questions}</span>
                </div>
              </div>

              <div className="overflow-x-auto border border-outline-variant">
                <table className="w-full text-left font-mono text-sm border-collapse">
                  <thead>
                    <tr className="bg-surface text-on-surface-variant border-b border-outline-variant">
                      <th className="py-3 px-4 font-normal">Variant</th>
                      <th className="py-3 px-4 font-normal">Faithfulness</th>
                      <th className="py-3 px-4 font-normal">Answer Rel.</th>
                      <th className="py-3 px-4 font-normal">Context Prec.</th>
                      <th className="py-3 px-4 font-normal">Context Rec.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(run.variants).map(([vName, vData], vIdx) => {
                      const ragas = vData.ragas_scores || {};
                      return (
                        <tr key={vName} className={`border-b border-outline-variant hover:bg-surface-variant/30 ${vIdx % 2 === 0 ? 'bg-surface' : 'bg-surface-container'} last:border-0`}>
                          <td className="py-3 px-4 font-bold text-primary">{vName}</td>
                          <td className="py-3 px-4">{ragas.faithfulness !== undefined ? ragas.faithfulness.toFixed(2) : '-'}</td>
                          <td className="py-3 px-4">{ragas.answer_relevancy !== undefined ? ragas.answer_relevancy.toFixed(2) : '-'}</td>
                          <td className="py-3 px-4">{ragas.context_precision !== undefined ? ragas.context_precision.toFixed(2) : '-'}</td>
                          <td className="py-3 px-4">{ragas.context_recall !== undefined ? ragas.context_recall.toFixed(2) : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Step3Results;
