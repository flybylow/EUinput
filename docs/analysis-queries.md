# Analysis Queries

SQL queries for analyzing research responses.

---

## Response Metrics

### Total Responses

```sql
-- Overall statistics
SELECT 
  COUNT(*) as total_responses,
  COUNT(CASE WHEN completed THEN 1 END) as completed_responses,
  ROUND(100.0 * COUNT(CASE WHEN completed THEN 1 END) / COUNT(*), 1) as completion_rate,
  ROUND(AVG(duration_seconds)) as avg_duration_secs,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as emails_collected,
  ROUND(100.0 * COUNT(CASE WHEN email IS NOT NULL THEN 1 END) / COUNT(*), 1) as email_opt_in_rate
FROM consumer_research_responses;
```

### Responses Over Time

```sql
-- Daily response count
SELECT 
  DATE(created_at) as date,
  COUNT(*) as responses,
  COUNT(CASE WHEN completed THEN 1 END) as completed
FROM consumer_research_responses
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Average Duration

```sql
-- Duration analysis
SELECT 
  ROUND(AVG(duration_seconds)) as avg_seconds,
  ROUND(AVG(duration_seconds) / 60.0, 1) as avg_minutes,
  MIN(duration_seconds) as shortest,
  MAX(duration_seconds) as longest,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_seconds) as median_seconds
FROM consumer_research_responses
WHERE duration_seconds IS NOT NULL;
```

---

## Source Analysis

### Responses by Source

```sql
-- Traffic source performance
SELECT 
  source,
  COUNT(*) as total,
  COUNT(CASE WHEN completed THEN 1 END) as completed,
  ROUND(100.0 * COUNT(CASE WHEN completed THEN 1 END) / COUNT(*), 1) as completion_rate,
  ROUND(AVG(duration_seconds) / 60.0, 1) as avg_minutes,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as emails
FROM consumer_research_responses
GROUP BY source
ORDER BY total DESC;
```

### Campaign Performance

```sql
-- Campaign effectiveness
SELECT 
  campaign,
  COUNT(*) as responses,
  ROUND(100.0 * COUNT(CASE WHEN completed THEN 1 END) / COUNT(*), 1) as completion_rate,
  COUNT(DISTINCT country) as countries_reached
FROM consumer_research_responses
GROUP BY campaign
ORDER BY responses DESC;
```

### Top Referrers

```sql
-- Individual referrer performance
SELECT 
  source,
  campaign,
  ref,
  COUNT(*) as responses,
  COUNT(CASE WHEN completed THEN 1 END) as completed
FROM consumer_research_responses
WHERE ref IS NOT NULL
GROUP BY source, campaign, ref
ORDER BY responses DESC
LIMIT 20;
```

---

## Geographic Analysis

### Countries Represented

```sql
-- Country distribution
SELECT 
  country,
  COUNT(*) as responses,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
FROM consumer_research_responses
WHERE country IS NOT NULL
GROUP BY country
ORDER BY responses DESC;
```

### EU Coverage

```sql
-- EU country count
SELECT 
  COUNT(DISTINCT country) as unique_countries,
  COUNT(*) as total_responses
FROM consumer_research_responses
WHERE country IS NOT NULL;
```

---

## Question Analysis

### Q1: Product Trust Issues

```sql
-- Most mentioned products
SELECT 
  q1_product,
  COUNT(*) as mentions,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
FROM consumer_research_responses
WHERE q1_product IS NOT NULL
GROUP BY q1_product
ORDER BY mentions DESC
LIMIT 15;
```

```sql
-- Common doubt themes (requires manual categorization or text analysis)
SELECT 
  q1_doubt,
  COUNT(*) as count
FROM consumer_research_responses
WHERE q1_doubt IS NOT NULL
GROUP BY q1_doubt
ORDER BY count DESC
LIMIT 20;
```

### Q2: What Needs Proof

```sql
-- What consumers want proven
SELECT 
  q2_proof,
  COUNT(*) as mentions
FROM consumer_research_responses
WHERE q2_proof IS NOT NULL
GROUP BY q2_proof
ORDER BY mentions DESC
LIMIT 20;
```

### Q3: Trusted Authorities

```sql
-- Who consumers trust
SELECT 
  q3_authority,
  COUNT(*) as mentions,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
FROM consumer_research_responses
WHERE q3_authority IS NOT NULL
GROUP BY q3_authority
ORDER BY mentions DESC;
```

### Q4: Preferred Format

```sql
-- Interface preferences
SELECT 
  q4_format,
  COUNT(*) as preferences
FROM consumer_research_responses
WHERE q4_format IS NOT NULL
GROUP BY q4_format
ORDER BY preferences DESC;
```

### Q5: Behavior Change

```sql
-- Would transparency change shopping behavior?
SELECT 
  CASE 
    WHEN q5_behavior ILIKE '%yes%' THEN 'Yes'
    WHEN q5_behavior ILIKE '%no%' THEN 'No'
    WHEN q5_behavior ILIKE '%maybe%' OR q5_behavior ILIKE '%perhaps%' THEN 'Maybe'
    ELSE 'Unclear'
  END as would_change_behavior,
  COUNT(*) as responses,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
FROM consumer_research_responses
WHERE q5_behavior IS NOT NULL
GROUP BY would_change_behavior
ORDER BY responses DESC;
```

### Q5: Willingness to Pay More

```sql
-- Premium for transparency
SELECT 
  CASE 
    WHEN q5_pay_more ILIKE '%no%' THEN 'No'
    WHEN q5_pay_more ILIKE '%yes%' THEN 'Yes'
    WHEN q5_pay_more ILIKE '%maybe%' OR q5_pay_more ILIKE '%perhaps%' THEN 'Maybe'
    WHEN q5_pay_more SIMILAR TO '%[0-9]+%' THEN 'Specific Amount'
    ELSE 'Unclear'
  END as willing_to_pay,
  COUNT(*) as responses,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
FROM consumer_research_responses
WHERE q5_pay_more IS NOT NULL
GROUP BY willing_to_pay
ORDER BY responses DESC;
```

---

## Cross-Analysis

### Trust by Country

```sql
-- Authority preferences by country
SELECT 
  country,
  q3_authority,
  COUNT(*) as mentions
FROM consumer_research_responses
WHERE country IS NOT NULL AND q3_authority IS NOT NULL
GROUP BY country, q3_authority
ORDER BY country, mentions DESC;
```

### Product Categories by Demographics

```sql
-- Product concerns by source (proxy for demographics)
SELECT 
  source,
  q1_product,
  COUNT(*) as mentions
FROM consumer_research_responses
WHERE q1_product IS NOT NULL
GROUP BY source, q1_product
ORDER BY source, mentions DESC;
```

---

## Data Quality

### Completion Analysis

```sql
-- Where users drop off
SELECT 
  CASE 
    WHEN q1_product IS NULL THEN 'Before Q1'
    WHEN q2_proof IS NULL THEN 'After Q1'
    WHEN q3_authority IS NULL THEN 'After Q2'
    WHEN q4_format IS NULL THEN 'After Q3'
    WHEN q5_behavior IS NULL THEN 'After Q4'
    WHEN email IS NULL THEN 'After Q5'
    ELSE 'Completed'
  END as drop_off_point,
  COUNT(*) as count
FROM consumer_research_responses
GROUP BY drop_off_point
ORDER BY count DESC;
```

### Response Quality

```sql
-- Responses with all fields populated
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN 
    q1_product IS NOT NULL AND
    q1_doubt IS NOT NULL AND
    q2_proof IS NOT NULL AND
    q3_authority IS NOT NULL AND
    q4_format IS NOT NULL AND
    q5_behavior IS NOT NULL AND
    q5_pay_more IS NOT NULL AND
    email IS NOT NULL AND
    country IS NOT NULL
  THEN 1 END) as complete_responses,
  ROUND(100.0 * COUNT(CASE WHEN 
    q1_product IS NOT NULL AND
    q1_doubt IS NOT NULL AND
    q2_proof IS NOT NULL AND
    q3_authority IS NOT NULL AND
    q4_format IS NOT NULL AND
    q5_behavior IS NOT NULL AND
    q5_pay_more IS NOT NULL AND
    email IS NOT NULL AND
    country IS NOT NULL
  THEN 1 END) / COUNT(*), 1) as quality_rate
FROM consumer_research_responses;
```

---

## Export Queries

### Full Dataset Export

```sql
-- Export all responses for analysis
SELECT 
  id,
  created_at,
  conversation_id,
  duration_seconds,
  source,
  campaign,
  ref,
  q1_product,
  q1_doubt,
  q2_proof,
  q3_authority,
  q4_format,
  q5_behavior,
  q5_pay_more,
  email,
  country,
  completed
FROM consumer_research_responses
ORDER BY created_at DESC;
```

### Summary for Report

```sql
-- Executive summary stats
SELECT 
  COUNT(*) as "Total Responses",
  COUNT(CASE WHEN completed THEN 1 END) as "Completed",
  ROUND(100.0 * COUNT(CASE WHEN completed THEN 1 END) / COUNT(*), 1) || '%' as "Completion Rate",
  ROUND(AVG(duration_seconds) / 60.0, 1) || ' min' as "Avg Duration",
  COUNT(DISTINCT country) as "Countries",
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as "Email Opt-ins"
FROM consumer_research_responses;
```

---

## Monitoring Queries (Real-time)

### Today's Stats

```sql
-- Today's performance
SELECT 
  COUNT(*) as responses_today,
  COUNT(CASE WHEN completed THEN 1 END) as completed_today,
  ROUND(AVG(duration_seconds) / 60.0, 1) as avg_minutes
FROM consumer_research_responses
WHERE DATE(created_at) = CURRENT_DATE;
```

### Recent Responses

```sql
-- Last 10 responses
SELECT 
  created_at,
  source,
  country,
  completed,
  ROUND(duration_seconds / 60.0, 1) as minutes
FROM consumer_research_responses
ORDER BY created_at DESC
LIMIT 10;
```

---

*Last updated: January 6, 2026*

