# Knowledge Graph Visualization Troubleshooting Guide

## Quick Diagnosis Steps

### 1. **Test Basic Functionality**
First, try the simpler test page:
- Navigate to: `frontend/src/pages/visualization/test-viz.html`
- Open browser Developer Tools (F12)
- Click "Test D3" - you should see 3 connected circles
- Click "Load Sample" - you should see a small network graph

### 2. **Check Browser Console**
Open Developer Tools (F12) and look for:
- **Red errors** in the Console tab
- **Network errors** (failed to load D3.js)
- **JavaScript errors** in the visualization code

### 3. **Verify File Structure**
Ensure these files exist:
```
frontend/
├── src/pages/visualization/
│   ├── visualization.html
│   ├── visualization.js
│   └── test-viz.html
├── dist/
│   └── output.css
```

## Common Issues and Solutions

### Issue 1: Blank/Empty Graph Container

**Symptoms**: 
- Page loads but graph area is empty
- No errors in console

**Solutions**:
1. **Check Internet Connection**:
   - D3.js loads from CDN: `https://d3js.org/d3.v7.min.js`
   - If offline, download D3.js locally

2. **Try Test Page**:
   - Open `test-viz.html` instead
   - Click "Test D3" button
   - If this works, the main visualization has a bug

3. **Check CSS Build**:
   ```bash
   cd frontend
   npm run build
   ```

### Issue 2: "D3.js not loaded" Error

**Symptoms**:
- Error message about D3.js not being available
- Console shows network error for D3.js

**Solutions**:
1. **Download D3.js Locally**:
   ```bash
   cd frontend/src/pages/visualization/
   curl -o d3.v7.min.js https://d3js.org/d3.v7.min.js
   ```
   
   Then update HTML:
   ```html
   <script src="d3.v7.min.js"></script>
   ```

2. **Check Firewall/Proxy**:
   - Corporate networks may block CDN access
   - Try different D3.js CDN: `https://cdn.jsdelivr.net/npm/d3@7`

### Issue 3: JSON File Upload Not Working

**Symptoms**:
- File selected but nothing happens
- "JSON parse error" message

**Solutions**:
1. **Verify JSON File Format**:
   Open your `knowledge-weaver-complete-2025-06-30.json` and check:
   - Starts with `{` and ends with `}`
   - No trailing commas
   - Proper quotes around strings

2. **Check File Size**:
   - Very large files (>10MB) may timeout
   - Try with a smaller sample first

3. **Test with Known Good File**:
   Create a minimal test file `test.json`:
   ```json
   {
     "metadata": {"totalNotes": 1},
     "categories": [{"category": "Test", "definition": "Test category"}],
     "notes": [{
       "id": "note-1",
       "content": "Test note",
       "categories": ["Test"],
       "metadata": {"domain": "test.com"}
     }]
   }
   ```

### Issue 4: Graph Renders But No Nodes Visible

**Symptoms**:
- Filters show node counts > 0
- Graph area appears active but no visual elements

**Solutions**:
1. **Reset View**:
   - Click "🔄 Reset View" button
   - Try zooming out (mouse wheel)

2. **Check Node Colors**:
   - Nodes might be rendered in same color as background
   - Open browser Developer Tools → Elements tab
   - Look for `<circle>` elements in the SVG

3. **Adjust Force Parameters**:
   - Try different Force Strength values (-100 to -3000)
   - Adjust Link Distance (30 to 200)

### Issue 5: Performance Issues with Large Datasets

**Symptoms**:
- Page becomes unresponsive
- Very slow rendering

**Solutions**:
1. **Filter Data First**:
   - Use node type filters to show fewer nodes
   - Start with just "Notes" and "Categories"

2. **Reduce Link Distance**:
   - Set Link Distance to 30-50
   - Increase Force Strength to -2000 or higher

## Browser-Specific Issues

### Chrome/Edge
- **CORS Issues**: If testing locally, run a local server:
  ```bash
  cd frontend
  python -m http.server 8080
  # Then visit: http://localhost:8080/src/pages/visualization/visualization.html
  ```

### Firefox
- **SVG Rendering**: Some versions have SVG performance issues
- Try disabling hardware acceleration in Firefox settings

### Safari
- **D3.js Compatibility**: Ensure using D3.js v7+ for full Safari support

## Step-by-Step Debug Process

### Step 1: Basic Setup
1. Open `test-viz.html` in browser
2. Open Developer Tools (F12)
3. Check for any red errors in Console
4. Click "Test D3" - should see circles

### Step 2: Sample Data Test
1. In `test-viz.html`, click "Load Sample"
2. Should see a small network with colored nodes
3. Try dragging nodes around

### Step 3: Your Data Test
1. In `test-viz.html`, click "Choose File"
2. Select your `knowledge-weaver-complete-2025-06-30.json`
3. Check console for any parsing errors
4. Should see your actual data visualized

### Step 4: Full Visualization
1. If test page works, open `visualization.html`
2. Upload the same JSON file
3. Use the filters to reduce complexity if needed

## Getting Help

### Console Debug Commands
Open browser console and try:
```javascript
// Check if D3 is loaded
console.log(typeof d3);

// Check current data
console.log('Nodes:', window.graphData?.nodes?.length);
console.log('Links:', window.graphData?.links?.length);

// Force reload visualization
if (window.loadSampleData) window.loadSampleData();
```

### Export Debug Info
If issues persist:
1. Open browser Developer Tools
2. Go to Console tab
3. Copy all error messages
4. Go to Network tab, look for failed requests
5. Share this information for further debugging

## Performance Tips

### For Large Knowledge Graphs (>100 notes):
1. **Start with filters**: Enable only "Notes" and "Categories"
2. **Increase force strength**: -2000 or higher
3. **Reduce link distance**: 30-50 pixels
4. **Disable labels initially**: Uncheck "Show Labels"
5. **Use incremental loading**: Load subsets of data

### For Very Large Datasets (>500 notes):
Consider using the test visualization which is more optimized for large datasets.

## Alternative Visualization Options

If the D3.js visualization continues to have issues:

### Option 1: Export to External Tools
- Export as CSV and import into tools like Gephi, Cytoscape, or Obsidian
- Use the enhanced Markdown export for manual visualization

### Option 2: Simplified Static Visualization
Create a simple HTML table showing relationships:
```html
<table>
  <tr><th>Note</th><th>Categories</th><th>Domain</th></tr>
  <!-- Populate from JSON data -->
</table>
```

The goal is to get your knowledge graph visualized - if one method doesn't work, we can try another approach!