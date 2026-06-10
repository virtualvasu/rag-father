import React, { useEffect, useState } from 'react';
import { getAllEvaluations, deleteEvaluation } from '../../utils/db';
import { Clock, Trash2, ChevronDown, ChevronUp, AlertCircle, Archive, Database, Settings, TestTube2, Calendar } from 'lucide-react';

const formatKey = (key) => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const ParamList = ({ params }) => (
  <ul className="space-y-2">
    {Object.entries(params).map(([k, v]) => (
      <li key={k} className="flex justify-between items-center border-b border-border/50 pb-2 last:border-0 last:pb-0">
        <span className="text-xs font-mono text-text-secondary truncate pr-4">{formatKey(k)}</span>
        <span className="text-xs font-sans font-medium text-text-primary bg-surface-dark px-2 py-1 rounded border border-border max-w-[50%] truncate text-right">
          {typeof v === 'boolean' ? (v ? 'True' : 'False') : 
           Array.isArray(v) ? v.join(', ') : 
           (v === null || v === undefined) ? 'None' : String(v)}
        </span>
      </li>
    ))}
  </ul>
);

const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown Date';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp;
  return date.toLocaleString('en-US', { 
    weekday: 'short', month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};

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

  const getColorClass = (val) => {
    if (val === undefined || val === null) return 'text-text-muted';
    if (val >= 0.8) return 'text-emerald-400 font-bold';
    if (val >= 0.6) return 'text-amber-400 font-medium';
    return 'text-error font-medium';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-surface-high border border-border rounded-2xl">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-2xl p-6 md:p-8 bg-surface-high shadow-lg relative overflow-hidden">

      
      <h2 className="text-xl font-display font-semibold mb-6 text-text-primary flex items-center gap-2 relative z-10">
        <Archive className="w-5 h-5 text-primary" />
        Evaluation History
      </h2>
      
      <div className="mb-8 p-4 bg-error/10 border border-error/50 rounded-xl flex items-start gap-3 relative z-10">
        <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
        <p className="text-sm font-sans text-error leading-relaxed">
          <strong>Note:</strong> To achieve the exact same RAG performance shown in past evaluations, you must retrain the pipeline using the same parameters and files if they differ from the current active training.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-surface border border-border rounded-xl border-dashed">
          <Clock className="w-8 h-8 text-text-muted mb-4" />
          <p className="text-sm font-sans text-text-secondary text-center">No past evaluations found in local database.</p>
        </div>
      ) : (
        <div className="space-y-6 relative z-10">
          {history.map((run, idx) => (
            <div key={run.filename || idx} className="bg-surface-dark border border-border rounded-xl overflow-hidden shadow-sm transition-all hover:border-primary/30">
              <div 
                className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer bg-surface/50 hover:bg-surface transition-colors gap-4"
                onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
              >
                <div>
                  <h3 className="font-sans text-lg text-primary font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {formatDate(run.timestamp)}
                  </h3>
                  <p className="text-xs font-mono text-text-muted mt-1 flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    ID: {run.filename.replace('.json', '')}
                  </p>
                </div>
                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-center bg-surface p-2 rounded-lg border border-border min-w-[100px]">
                    <span className="block text-[10px] font-mono text-text-muted uppercase mb-0.5">Questions</span>
                    <span className="text-lg font-bold font-mono text-text-primary">{run.num_questions}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleDelete(e, run.filename)}
                      className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                      title="Delete evaluation"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="p-2 text-text-muted">
                      {expandedRow === idx ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>
              </div>

              {expandedRow === idx && (
                <div className="p-6 border-t border-border space-y-8 bg-surface-highest/30">
                  
                  {/* Scores Table */}
                  <div>
                    <h4 className="font-sans text-sm font-semibold text-text-primary mb-3 flex items-center gap-2 border-b border-border pb-2">
                      <TestTube2 className="w-4 h-4 text-accent" />
                      Variant Scores
                    </h4>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-left font-mono text-sm border-collapse bg-surface-dark">
                        <thead>
                          <tr className="bg-surface text-text-secondary border-b border-border">
                            <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Variant</th>
                            <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Faithfulness</th>
                            <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Answer Rel.</th>
                            <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Context Prec.</th>
                            <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Context Rec.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(run.variants || {}).map(([vName, vData], vIdx) => {
                            const ragas = vData.ragas_scores || {};
                            return (
                              <tr key={vName} className={`border-b border-border last:border-0 hover:bg-surface-highest/50 transition-colors ${vIdx % 2 === 0 ? 'bg-surface/30' : 'bg-surface/10'}`}>
                                <td className="py-3 px-4 font-bold text-primary">{vName}</td>
                                <td className={`py-3 px-4 ${getColorClass(ragas.faithfulness)}`}>{formatPercent(ragas.faithfulness)}</td>
                                <td className={`py-3 px-4 ${getColorClass(ragas.answer_relevancy)}`}>{formatPercent(ragas.answer_relevancy)}</td>
                                <td className={`py-3 px-4 ${getColorClass(ragas.context_precision)}`}>{formatPercent(ragas.context_precision)}</td>
                                <td className={`py-3 px-4 ${getColorClass(ragas.context_recall)}`}>{formatPercent(ragas.context_recall)}</td>
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
                      <h4 className="font-sans text-sm font-semibold text-text-primary mb-3 flex items-center gap-2 border-b border-border pb-2">
                        <Database className="w-4 h-4 text-primary" />
                        Files Used for Training
                      </h4>
                      <div className="bg-surface border border-border rounded-xl p-4 h-48 overflow-y-auto custom-scrollbar">
                        {run.files_used && run.files_used.length > 0 ? (
                          <ul className="list-disc pl-5 font-mono text-xs text-text-secondary space-y-1">
                            {run.files_used.map((f, i) => <li key={i}>{f}</li>)}
                          </ul>
                        ) : (
                          <p className="text-xs font-sans text-text-muted italic flex items-center justify-center h-full">Unknown or no files</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-sans text-sm font-semibold text-text-primary mb-3 flex items-center gap-2 border-b border-border pb-2">
                        <Settings className="w-4 h-4 text-primary" />
                        Pipeline Parameters
                      </h4>
                      <div className="bg-surface border border-border rounded-xl p-4 h-48 overflow-y-auto custom-scrollbar">
                        {run.pipeline_params && Object.keys(run.pipeline_params).length > 0 ? (
                          <ParamList params={run.pipeline_params} />
                        ) : (
                          <p className="text-xs font-sans text-text-muted italic flex items-center justify-center h-full">Unknown parameters</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-sans text-sm font-semibold text-text-primary mb-3 flex items-center gap-2 border-b border-border pb-2">
                        <Settings className="w-4 h-4 text-accent" />
                        Eval Parameters
                      </h4>
                      <div className="bg-surface border border-border rounded-xl p-4 h-48 overflow-y-auto custom-scrollbar">
                        {run.eval_params && Object.keys(run.eval_params).length > 0 ? (
                          <ParamList params={run.eval_params} />
                        ) : (
                          <p className="text-xs font-sans text-text-muted italic flex items-center justify-center h-full">Unknown parameters</p>
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
