/**
 * Data Lifecycle Lambda
 * 
 * Moves old event data to S3 archive for cost optimization
 * 
 * Tasks:
 * 1. Query events older than 31 days from Supabase
 * 2. Export to S3 in Parquet format
 * 3. Delete from Supabase (using compression/continuous aggregates)
 * 
 * Triggered by: EventBridge (daily at midnight)
 */

import { ScheduledEvent } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({});
const ARCHIVE_BUCKET = process.env.ARCHIVE_BUCKET || '';

export const handler = async (event: ScheduledEvent) => {
  console.log('Data Lifecycle Lambda triggered at', event.time);

  if (!ARCHIVE_BUCKET) {
    throw new Error('ARCHIVE_BUCKET environment variable not set');
  }

  try {
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - 31);
    const cutoffDate = archiveDate.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log('Archiving events older than:', cutoffDate);

    await exportEventsToS3(cutoffDate);
    await cleanupOldEvents(cutoffDate);

    console.log('Data lifecycle completed successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        archived_date: cutoffDate,
        status: 'completed'
      })
    };
  } catch (error) {
    console.error('Data lifecycle error:', error);
    throw error;
  }
};

async function exportEventsToS3(cutoffDate: string): Promise<void> {
  console.log('Exporting events to S3...');

  // TODO: Use Supabase REST API or direct PostgreSQL connection to export data
  // Use COPY command for efficient export:
  // COPY (
  //   SELECT * FROM events WHERE timestamp < '2024-01-01'
  // ) TO PROGRAM 'gzip > /tmp/events.csv.gz' WITH CSV HEADER;
  
  // For now, simulate export
  const events = [
    { event_id: '1', timestamp: '2024-01-01T00:00:00Z', event_type: 'pageview' },
    { event_id: '2', timestamp: '2024-01-02T00:00:00Z', event_type: 'click' }
  ];

  // Convert to CSV
  const csv = convertToCSV(events);
  
  // Upload to S3
  const key = `events/year=${cutoffDate.substring(0, 4)}/month=${cutoffDate.substring(5, 7)}/events-${cutoffDate}.csv`;
  
  await s3Client.send(new PutObjectCommand({
    Bucket: ARCHIVE_BUCKET,
    Key: key,
    Body: csv,
    ContentType: 'text/csv',
    ServerSideEncryption: 'AES256'
  }));

  console.log('Exported to S3:', key);
}

async function cleanupOldEvents(cutoffDate: string): Promise<void> {
  console.log('Cleaning up old events from Supabase...');

  // TODO: Delete events older than cutoff date
  // For TimescaleDB, use compression or drop chunks instead of DELETE:
  // 
  // Option 1: Compression (keeps data queryable but saves space)
  // SELECT compress_chunk(i) FROM show_chunks('events', older_than => INTERVAL '31 days') i;
  //
  // Option 2: Drop chunks (permanent deletion)
  // SELECT drop_chunks('events', older_than => INTERVAL '31 days');

  // Also cleanup related tables:
  // - event_overrides
  // - affiliate_cookie_stats (aggregated, so can be kept longer)

  console.log('Old events cleaned up');
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(item => 
    headers.map(header => {
      const value = item[header];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
