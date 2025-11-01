# Bank API Adapters

This project supports dynamic loading of loan templates from bank APIs through a pluggable adapter system.

## Architecture

### Adapter Interface

All bank adapters implement the `BankApiAdapter` interface located in `src/config/bank-adapters/types.ts`:

- `fetchTemplates()` - Fetches templates from the bank's API
- `mapToTemplates()` - Converts API response to our Template format
- `validateResponse()` - Validates API response structure

### Belarusbank Adapter

The Belarusbank adapter (`BelarusbankAdapter`) loads loan data from the Belarusbank API.

**API Documentation**: https://belarusbank.by/be/33139/forDevelopers/api/kredits

#### CORS Workaround

Since the Belarusbank API doesn't have CORS headers configured, we use a GitHub Actions workflow to:

1. Fetch data from the API server-side (no CORS restrictions)
2. Store the response in `public/data/belarusbank-loans.json`
3. The adapter reads from this static file instead of calling the API directly

#### GitHub Actions Workflow

The workflow (`.github/workflows/update-belarusbank-data.yml`) runs:
- **Daily at 3:00 AM UTC** - Scheduled updates
- **On-demand** - Can be triggered manually via `workflow_dispatch`

The workflow:
1. Fetches data from `https://belarusbank.by/api/kredits_info`
2. Validates the JSON response
3. Saves it to `public/data/belarusbank-loans.json`
4. Commits and pushes the changes (if different)

#### Adapter Behavior

The Belarusbank adapter:
1. **First tries** to load from `/data/belarusbank-loans.json` (static file, no CORS)
2. **Falls back** to direct API call if file doesn't exist (may fail due to CORS)
3. Implements in-memory caching (1 hour TTL)
4. Supports filtering by credit types via the `types` option

## Adding New Bank Adapters

1. Create a new adapter class implementing `BankApiAdapter`
2. Implement the required methods:
   - `fetchTemplates()`
   - `mapToTemplates()`
   - `validateResponse()`
3. Register the adapter in `src/config/bank-adapters/index.ts`:
   ```typescript
   const adapter = new YourBankAdapter();
   registerAdapter(adapter);
   ```
4. Call `initializeAdapters()` on app startup (already done in `main.tsx`)

## Template Mapping

When mapping API responses to our `Template` format, ensure you map:
- Currency codes (e.g., "BYN", "USD", "EUR")
- Interest rates (may need parsing from strings/formulas)
- Loan terms (convert to months if needed)
- Grace periods (if supported)
- Constraints (min/max amounts, allowed terms, etc.)

## Static File Storage

The `public/data/` directory stores static JSON files updated by GitHub Actions:
- Files are committed to the repository
- Accessed via relative URLs (e.g., `/data/belarusbank-loans.json`)
- No CORS restrictions since they're served from the same origin

