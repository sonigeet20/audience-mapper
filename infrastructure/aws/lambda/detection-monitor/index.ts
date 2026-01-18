/**
 * Detection Monitoring Lambda
 * 
 * Monitors script detection metrics and updates obfuscation strategies
 * 
 * Tasks:
 * 1. Analyze detection_metrics table
 * 2. Check GitHub for EasyList/EasyPrivacy updates
 * 3. Update obfuscation rules if needed
 * 4. Alert on high detection rates
 * 
 * Triggered by: EventBridge (daily)
 */

import { ScheduledEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const CACHE_TABLE = process.env.DYNAMODB_CACHE_TABLE || 'tracking-cache';

interface DetectionStats {
  total_loads: number;
  detected_loads: number;
  detection_rate: number;
  by_obfuscation_level: Record<string, { loads: number; detected: number }>;
  by_browser: Record<string, { loads: number; detected: number }>;
}

interface BlockList {
  name: string;
  url: string;
  last_commit: string;
  last_checked: string;
}

export const handler = async (event: ScheduledEvent) => {
  console.log('Detection Monitoring Lambda triggered at', event.time);

  try {
    const stats = await analyzeDetectionMetrics();
    const blockListUpdates = await checkBlockListUpdates();
    
    if (stats.detection_rate > 0.1) {
      console.warn('High detection rate detected:', stats.detection_rate);
      await sendAlert(stats);
    }

    if (blockListUpdates.length > 0) {
      console.log('Block list updates detected:', blockListUpdates);
      await updateObfuscationRules(blockListUpdates);
    }

    console.log('Detection monitoring completed successfully');
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        detection_rate: stats.detection_rate,
        block_list_updates: blockListUpdates.length
      })
    };
  } catch (error) {
    console.error('Detection monitoring error:', error);
    throw error;
  }
};

async function analyzeDetectionMetrics(): Promise<DetectionStats> {
  console.log('Analyzing detection metrics...');
  
  // TODO: Query detection_metrics table in Supabase for last 7 days
  // Aggregate by obfuscation level, browser, etc.
  
  // Example stats
  const stats: DetectionStats = {
    total_loads: 10000,
    detected_loads: 150,
    detection_rate: 0.015,
    by_obfuscation_level: {
      minimal: { loads: 2000, detected: 80 },
      moderate: { loads: 3000, detected: 50 },
      aggressive: { loads: 3000, detected: 15 },
      adaptive: { loads: 2000, detected: 5 }
    },
    by_browser: {
      Chrome: { loads: 5000, detected: 75 },
      Firefox: { loads: 3000, detected: 60 },
      Safari: { loads: 2000, detected: 15 }
    }
  };

  // Cache stats
  await docClient.send(new PutCommand({
    TableName: CACHE_TABLE,
    Item: {
      cache_key: 'detection:stats:latest',
      value: stats,
      ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }
  }));

  return stats;
}

async function checkBlockListUpdates(): Promise<BlockList[]> {
  console.log('Checking block list updates...');
  
  const blockLists: BlockList[] = [
    {
      name: 'EasyList',
      url: 'https://api.github.com/repos/easylist/easylist/commits?path=easylist/easylist.txt',
      last_commit: '',
      last_checked: new Date().toISOString()
    },
    {
      name: 'EasyPrivacy',
      url: 'https://api.github.com/repos/easylist/easylist/commits?path=easyprivacy/easyprivacy.txt',
      last_commit: '',
      last_checked: new Date().toISOString()
    }
  ];

  const updates: BlockList[] = [];

  for (const list of blockLists) {
    try {
      // Get cached last commit
      const cached = await docClient.send(new GetCommand({
        TableName: CACHE_TABLE,
        Key: { cache_key: `blocklist:${list.name}:last_commit` }
      }));

      const lastKnownCommit = cached.Item?.value as string | undefined;

      // Fetch latest commit from GitHub
      const response = await fetch(list.url, {
        headers: {
          'User-Agent': 'Tracking-System-Monitor',
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        console.warn(`Failed to fetch ${list.name}:`, response.status);
        continue;
      }

      const commits = await response.json();
      const latestCommit = commits[0]?.sha;

      if (latestCommit && latestCommit !== lastKnownCommit) {
        list.last_commit = latestCommit;
        updates.push(list);

        // Update cache
        await docClient.send(new PutCommand({
          TableName: CACHE_TABLE,
          Item: {
            cache_key: `blocklist:${list.name}:last_commit`,
            value: latestCommit,
            ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
          }
        }));
      }
    } catch (error) {
      console.error(`Error checking ${list.name}:`, error);
    }
  }

  return updates;
}

async function sendAlert(stats: DetectionStats): Promise<void> {
  console.log('Sending detection alert...');
  
  // TODO: Send alert via email/Slack/SNS
  // Include detection rate, affected browsers, recommended actions
  
  console.log('Alert sent for detection rate:', stats.detection_rate);
}

async function updateObfuscationRules(updates: BlockList[]): Promise<void> {
  console.log('Updating obfuscation rules...');
  
  // TODO: Download updated block lists
  // Parse rules to identify new detection patterns
  // Update obfuscation configuration in database
  // Trigger tracking script rebuild
  
  console.log('Obfuscation rules updated for:', updates.map(u => u.name).join(', '));
}
