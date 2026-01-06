# Tracking Links Guide

How to create and manage tracking links for different traffic sources.

---

## URL Structure

Base URL: `https://your-app.vercel.app/research`

Query parameters:
- `source` - Traffic source (linkedin, howest, email, etc.)
- `campaign` - Campaign type (launch, academic, partner)
- `ref` - Specific referrer or person who shared

**Full format:**
```
https://your-app.vercel.app/research?source=SOURCE&campaign=CAMPAIGN&ref=REF
```

---

## Standard Tracking Links

### Phase 1: Soft Launch (Week 1)

**Personal Network:**
```
https://your-app.vercel.app/research?source=network&campaign=soft_launch&ref=ward
https://your-app.vercel.app/research?source=network&campaign=soft_launch&ref=jacky
https://your-app.vercel.app/research?source=network&campaign=soft_launch&ref=[name]
```

**LinkedIn Personal:**
```
https://your-app.vercel.app/research?source=linkedin&campaign=soft_launch&ref=ward
```

---

### Phase 2: Academic (Week 2-3)

**Howest University:**
```
https://your-app.vercel.app/research?source=howest&campaign=academic&ref=university
https://your-app.vercel.app/research?source=howest&campaign=academic&ref=prof_name
```

**Thomas More University:**
```
https://your-app.vercel.app/research?source=thomasmore&campaign=academic&ref=university
https://your-app.vercel.app/research?source=thomasmore&campaign=academic&ref=prof_name
```

**Student Panels:**
```
https://your-app.vercel.app/research?source=howest&campaign=student_panel&ref=batch_jan_2026
```

---

### Phase 3: Open Launch (Week 4+)

**LinkedIn Post:**
```
https://your-app.vercel.app/research?source=linkedin&campaign=launch&ref=ward_post
```

**Substack Newsletter:**
```
https://your-app.vercel.app/research?source=email&campaign=newsletter&ref=substack
```

**Twitter/X:**
```
https://your-app.vercel.app/research?source=twitter&campaign=launch&ref=ward_tweet
```

---

### Partner Distribution

**GS1 Belgium:**
```
https://your-app.vercel.app/research?source=gs1&campaign=partner&ref=gs1belgium
```

**Industry Partners:**
```
https://your-app.vercel.app/research?source=partner&campaign=industry&ref=partner_name
```

**Conference/Event:**
```
https://your-app.vercel.app/research?source=event&campaign=conference&ref=event_name_2026
```

---

## Shortened Links (Optional)

Use a URL shortener for social media:

**Bitly format:**
```
https://bit.ly/euinput-linkedin → redirects to full tracking URL
https://bit.ly/euinput-howest → redirects to academic tracking URL
```

**Custom short domain (if available):**
```
https://eu.in/li-ward → LinkedIn Ward
https://eu.in/howest → Howest
```

---

## Link Management Spreadsheet

Track all links in a spreadsheet:

| Source | Campaign | Ref | Full URL | Short URL | Distributed Date | Expected Responses |
|--------|----------|-----|----------|-----------|------------------|-------------------|
| linkedin | soft_launch | ward | https://... | https://bit.ly/... | 2026-01-08 | 30 |
| howest | academic | university | https://... | - | 2026-01-15 | 200 |
| ... | ... | ... | ... | ... | ... | ... |

---

## Analytics Queries

### Track Performance by Source

```sql
-- Responses by source
SELECT 
  source,
  COUNT(*) as total_responses,
  COUNT(CASE WHEN completed THEN 1 END) as completed,
  ROUND(AVG(duration_seconds)) as avg_duration,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as emails_collected
FROM consumer_research_responses
GROUP BY source
ORDER BY total_responses DESC;
```

### Track Campaign Performance

```sql
-- Responses by campaign
SELECT 
  campaign,
  COUNT(*) as responses,
  ROUND(100.0 * COUNT(CASE WHEN completed THEN 1 END) / COUNT(*), 1) as completion_rate
FROM consumer_research_responses
GROUP BY campaign
ORDER BY responses DESC;
```

### Track Individual Referrers

```sql
-- Top referrers
SELECT 
  source,
  campaign,
  ref,
  COUNT(*) as responses
FROM consumer_research_responses
WHERE ref IS NOT NULL
GROUP BY source, campaign, ref
ORDER BY responses DESC
LIMIT 20;
```

---

## Best Practices

### 1. Consistent Naming

Use lowercase, no spaces:
- ✅ `linkedin`, `howest`, `soft_launch`
- ❌ `LinkedIn`, `Howest University`, `Soft Launch`

### 2. Meaningful Refs

Make refs identifiable:
- ✅ `ward`, `prof_smith`, `batch_jan_2026`
- ❌ `1`, `abc`, `x`

### 3. Track Everything

Always use tracking parameters:
- ✅ Every link has source/campaign/ref
- ❌ Never share the base URL without parameters

### 4. Document Links

Keep a master list:
- Where each link was shared
- When it was shared
- Expected reach/responses
- Actual performance

---

## Link Generator Tool (Optional)

Create a simple form to generate links:

```html
<!DOCTYPE html>
<html>
<head>
  <title>EUinput Link Generator</title>
</head>
<body>
  <h1>Tracking Link Generator</h1>
  <form id="linkForm">
    <label>Source: <input type="text" id="source" placeholder="linkedin"></label><br>
    <label>Campaign: <input type="text" id="campaign" placeholder="launch"></label><br>
    <label>Ref: <input type="text" id="ref" placeholder="ward"></label><br>
    <button type="submit">Generate Link</button>
  </form>
  <p id="output"></p>
  
  <script>
    document.getElementById('linkForm').addEventListener('submit', function(e) {
      e.preventDefault();
      const base = 'https://your-app.vercel.app/research';
      const source = document.getElementById('source').value;
      const campaign = document.getElementById('campaign').value;
      const ref = document.getElementById('ref').value;
      const url = `${base}?source=${source}&campaign=${campaign}&ref=${ref}`;
      document.getElementById('output').innerHTML = `<a href="${url}" target="_blank">${url}</a>`;
    });
  </script>
</body>
</html>
```

---

## Testing Links

Before distributing:

1. **Click the link** - Verify it loads the /research page
2. **Start conversation** - Check parameters pass through to ElevenLabs
3. **Complete interview** - Verify data arrives in Supabase with correct tracking
4. **Query database** - Confirm source/campaign/ref captured correctly

---

*Last updated: January 6, 2026*

