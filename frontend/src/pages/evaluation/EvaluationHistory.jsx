import React, { useEffect, useState } from 'react';
import { getAllEvaluations, deleteEvaluation } from '../../utils/db';

const EvaluationHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  const loadHistory = async () => {
    try {
      const data = await getAllEvaluations();
      // Sort descending by timestamp
      data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setHistory(data);
    } catch (e) {
      console.error("Failed to load history from IndexedDB", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (e, filename) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this evaluation result?")) {
      try {
        await deleteEvaluation(filename);
        await loadHistory();
      } catch (err) {
        console.error("Failed to delete evaluation", err);
      }
    }
  };

  const formatPercent = (val) => {
    if (val === undefined || val === null) return '-';
    return (val * 100).toFixed(1) + '%';
  };

  if (loading) {
    return <div className="p-6 font-mono text-sm">Loading history...</div>;
  }

  return (
    <div className="border border-outline-variant rounded-none p-6 bg-surface-container">
      <h2 className="text-headline-md font-headline-md mb-4 text-secondary">Evaluation History</h2>
      
      <div className="mb-6 p-4 bg-error/10 border border-error text-error rounded-none font-mono text-sm">
        <strong>Note:</strong> To achieve the exact same RAG performance shown in past evaluations, you must retrain the pipeline using the same parameters and files if they differ from the current active training. The pipeline has already been trained on the latest configuration.
      </div>

      {history.length === 0 ? (
        <p className="text-sm font-mono text-on-surface-variant">No past evaluations found in local database.</p>
      ) : (
        <div className="space-y-8">
          {history.map((run, idx) => (
            <div key={run.filename || idx} className="border border-outline-variant bg-surface">
              <div 
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-surface-variant/20"
                onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
              >
                <div>
                  <h3 className="font-mono text-lg text-primary font-bold">{run.filename}</h3>
                  <p className="text-xs font-mono text-on-surface-variant">Ran at: {run.timestamp}</p>
                </div>
                <div className="flex gap-6 items-center text-right">
                  <div>
                    <span className="text-xs font-mono text-on-surface-variant block">Questions</span>
                    <span className="text-xl font-mono text-secondary">{run.num_questions}</span>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, run.filename)}
                    className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                    title="Delete evaluation"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>

              {expandedRow === idx && (
                <div className="p-4 border-t border-outline-variant space-y-6 bg-surface-container">
                  
                  {/* Scores Table */}
                  <div>
                    <h4 className="font-mono text-sm text-primary mb-2 uppercase font-bold">Variant Scores</h4>
                    <div className="overflow-x-auto border border-outline-variant">
                      <table className="w-full text-left font-mono text-sm border-collapse bg-surface">
                        <thead>
                          <tr className="bg-surface-variant text-on-surface-variant border-b border-outline-variant">
                            <th className="py-2 px-3 font-normal">Variant</th>
                            <th className="py-2 px-3 font-normal">Faithfulness</th>
                            <th className="py-2 px-3 font-normal">Answer Rel.</th>
                            <th className="py-2 px-3 font-normal">Context Prec.</th>
                            <th className="py-2 px-3 font-normal">Context Rec.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(run.variants || {}).map(([vName, vData]) => {
                            const ragas = vData.ragas_scores || {};
                            return (
                              <tr key={vName} className="border-b border-outline-variant last:border-0 hover:bg-surface-variant/30">
                                <td className="py-2 px-3 font-bold text-primary">{vName}</td>
                                <td className="py-2 px-3">{formatPercent(ragas.faithfulness)}</td>
                                <td className="py-2 px-3">{formatPercent(ragas.answer_relevancy)}</td>
                                <td className="py-2 px-3">{formatPercent(ragas.context_precision)}</td>
                                <td className="py-2 px-3">{formatPercent(ragas.context_recall)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Training Context */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-mono text-sm text-primary mb-2 uppercase font-bold">Files Used for Training</h4>
                      <div className="bg-surface border border-outline-variant p-3 h-48 overflow-y-auto">
                        {run.files_used && run.files_used.length > 0 ? (
                          <ul className="list-disc pl-5 font-mono text-xs space-y-1">
                            {run.files_used.map((f, i) => <li key={i}>{f}</li>)}
                          </ul>
                        ) : (
                          <p className="text-xs font-mono text-on-surface-variant italic">Unknown or no files</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-mono text-sm text-primary mb-2 uppercase font-bold">Pipeline Parameters</h4>
                      <div className="bg-surface border border-outline-variant p-3 h-48 overflow-y-auto">
                        {run.pipeline_params && Object.keys(run.pipeline_params).length > 0 ? (
                          <pre className="font-mono text-xs whitespace-pre-wrap">
                            {JSON.stringify(run.pipeline_params, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-xs font-mono text-on-surface-variant italic">Unknown parameters</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-mono text-sm text-primary mb-2 uppercase font-bold">Eval Parameters</h4>
                      <div className="bg-surface border border-outline-variant p-3 h-48 overflow-y-auto">
                        {run.eval_params && Object.keys(run.eval_params).length > 0 ? (
                          <pre className="font-mono text-xs whitespace-pre-wrap">
                            {JSON.stringify(run.eval_params, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-xs font-mono text-on-surface-variant italic">Unknown parameters</p>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EvaluationHistory;
