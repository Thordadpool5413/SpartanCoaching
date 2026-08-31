# Hospice Sales Pro campaign report

Run this read-only query against the application database to compare the two
paid-social creatives. It groups the privacy-safe `campaign_click` landing
arrivals and `tool_preview_start` events by ad platform and creative variant.

> `campaign_click` is a tagged landing arrival, not a raw Meta or LinkedIn
> platform click. Raw ad-platform clicks must still be read from the platform
> dashboards. The query intentionally reads only the fixed metadata labels
> emitted by the web app.

```sql
WITH campaign_events AS (
  SELECT
    event_name,
    metadata::jsonb ->> 'source' AS platform,
    metadata::jsonb ->> 'campaign' AS campaign,
    metadata::jsonb ->> 'creative' AS creative
  FROM event_tracking
  WHERE event_type = 'public_funnel'
    AND event_name IN ('campaign_click', 'tool_preview_start')
    AND metadata IS NOT NULL
)
SELECT
  platform,
  creative,
  COUNT(*) FILTER (WHERE event_name = 'campaign_click') AS tagged_landing_arrivals,
  COUNT(*) FILTER (WHERE event_name = 'tool_preview_start') AS tool_preview_starts,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE event_name = 'tool_preview_start')
    / NULLIF(COUNT(*) FILTER (WHERE event_name = 'campaign_click'), 0),
    1
  ) AS preview_start_rate_percent
FROM campaign_events
WHERE campaign = 'hospice_sales_pro'
  AND platform IN ('instagram', 'linkedin')
  AND creative IN ('walk_in_prepared', 'make_field_coachable')
GROUP BY platform, creative
ORDER BY preview_start_rate_percent DESC NULLS LAST, tagged_landing_arrivals DESC;
```

The report contains aggregate event counts only. `event_tracking.member_id` is
not selected, and campaign metadata is restricted to platform, campaign, and
creative tokens.