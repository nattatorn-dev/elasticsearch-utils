import axios, { AxiosResponse } from 'axios';
import bunyan from 'bunyan';
import * as dotenv from 'dotenv';

interface IndexPatternAttributes {
  title: string;
  fields: string;
}
interface IndexPattern {
  attributes: IndexPatternAttributes;
}

interface Field {
  name: string;
  type: string;
  count: number;
  scripted: boolean;
  searchable: boolean;
  aggregatable: boolean;
  readFromDocValues: boolean;
  conflictDescriptions: Record<string, string>;
}

async function fetchIndexPattern(indexPatternId: string): Promise<IndexPattern> {
  const indexPattern = await axios.get<unknown, AxiosResponse<IndexPattern>>(
    `${process.env.KIBANA_BASE_URL}/api/saved_objects/index-pattern/${indexPatternId}`
  );

  return indexPattern.data;
}

function getConflictFields(indexPattern: IndexPattern): Field[] {
  const attributes = indexPattern.attributes;
  const fields = JSON.parse(attributes.fields) as Field[];

  const conflictTypeField = fields.filter((field) => field.type === 'conflict');

  return conflictTypeField;
}

function getIndexPatternName(indexPattern: IndexPattern): string {
  const name = indexPattern.attributes.title;
  return name;
}

function printField(log: bunyan, fields: Field[]) {
  const conflict = fields.map((field) => ({
    name: field.name,
    conflictDescriptions: field.conflictDescriptions,
  }));

  log.info({ conflict });
}

async function main() {
  dotenv.config();
  const log = bunyan.createLogger({ name: 'elasticsearch-tool' });
  const indexPatternId = process.env.INDEX_PATTERN_ID;
  const indexPattern = await fetchIndexPattern(indexPatternId);
  const indexPatternName = getIndexPatternName(indexPattern);
  log.debug({ event: 'get_index_pattern_name', indexPatternName });

  const fields = getConflictFields(indexPattern);

  printField(log, fields);
}

(async () => {
  await main();
})();
