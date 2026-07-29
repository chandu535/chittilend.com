/**
 * Checks the Google credentials and rebuilds the spreadsheet from the database.
 *
 *   npm run sheet:check     credentials and access only — writes nothing
 *   npm run sheet:sync      full rebuild of both tabs
 *
 * Runs against whichever database and spreadsheet the loaded env file names, so
 * `sheet:sync` is the dev sheet and `sheet:sync:prod` is the live one. Use this for the
 * first sync after setting the credentials up, and any time the spreadsheet needs putting
 * back after being edited by hand.
 */
import { getSheetConfig } from '../src/server/sheets/config';
import { ensureTabs, getAccessToken } from '../src/server/sheets/google';
import { syncSheet } from '../src/server/sheets/sync';

const CHECK_ONLY = process.argv.includes('--check');

async function main() {
  const config = getSheetConfig();
  if (!config) {
    console.error('Not configured. These three have to be set in the env file being used:');
    console.error('  GOOGLE_SERVICE_ACCOUNT_EMAIL   the service account\'s client_email');
    console.error('  GOOGLE_PRIVATE_KEY             its private_key, quoted, newlines as \\n');
    console.error('  GOOGLE_SHEET_ID                from the spreadsheet URL, between /d/ and /edit');
    process.exit(1);
  }

  console.log(`service account: ${config.clientEmail}`);
  console.log(`spreadsheet:     ${config.spreadsheetId}`);
  console.log(`type:            ${config.type}  ->  tabs "${config.loansTab}" and "${config.borrowersTab}"\n`);

  try {
    await getAccessToken(config);
    console.log('✓ credentials accepted by Google');
  } catch (error) {
    console.error('✗ Google would not issue a token.');
    console.error(`  ${error instanceof Error ? error.message : error}`);
    console.error('\n  Usually the private key: it must keep its BEGIN/END lines, and in a .env');
    console.error('  file it has to be in double quotes with newlines written as \\n.');
    process.exit(1);
  }

  try {
    const tabs = await ensureTabs(config, [config.loansTab, config.borrowersTab]);
    console.log(`✓ spreadsheet reachable, tabs ready: ${[...tabs.keys()].join(', ')}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ could not open the spreadsheet.\n  ${message}`);
    if (message.includes('403') || message.toLowerCase().includes('permission')) {
      console.error(`\n  Share the spreadsheet with ${config.clientEmail} as an Editor.`);
    }
    if (message.includes('404')) {
      console.error('\n  Check GOOGLE_SHEET_ID — it is the part of the URL between /d/ and /edit.');
    }
    process.exit(1);
  }

  if (CHECK_ONLY) {
    console.log('\nCheck only — nothing was written.');
    return;
  }

  console.log('\nrebuilding both tabs…');
  const outcome = await syncSheet({ force: true });

  if (outcome.status === 'synced') {
    console.log(`✓ ${outcome.loanRows} loans and ${outcome.borrowerRows} borrowers in ${outcome.durationMs}ms`);
    console.log(`  https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit`);
  } else if (outcome.status === 'failed') {
    console.error(`✗ ${outcome.error}`);
    process.exit(1);
  } else {
    console.error(`✗ skipped: ${outcome.reason}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
