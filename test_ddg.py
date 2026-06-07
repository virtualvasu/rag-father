from duckduckgo_search import DDGS
results = DDGS().text("consolidated FDI policy DPIIT filetype:pdf", max_results=5)
for r in results:
    print(r)
