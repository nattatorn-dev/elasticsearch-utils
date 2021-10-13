import axios, { AxiosResponse } from 'axios';

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

async function fetchIndexPattern(kibanaUrl: string, indexPatternId: string): Promise<IndexPattern> {
  const indexPattern = await axios.get<unknown, AxiosResponse<IndexPattern>>(
    `${kibanaUrl}/api/saved_objects/index-pattern/${indexPatternId}`
  );

  return indexPattern.data;
}

function findConflictType(field: Field) {
  return field.type === 'conflict';
}

function getConflictFields(indexPattern: IndexPattern): Field[] {
  const attributes = indexPattern.attributes;
  const fields = JSON.parse(attributes.fields) as Field[];

  const conflictTypeField = fields.filter(findConflictType);

  return conflictTypeField;
}

function getIndexPatternName(indexPattern: IndexPattern): string {
  const name = indexPattern.attributes.title;
  return name;
}

function printField(fields: Field[]) {
  const conflict = fields.map((field) => ({
    name: field.name,
    conflictDescriptions: field.conflictDescriptions,
  }));

  console.log(JSON.stringify(conflict));
}

async function main() {
  const [KIBANA_BASE_URL, INDEX_PATTERN_ID] = process.argv.slice(2);

  if (!KIBANA_BASE_URL) {
    throw new Error('KIBANA_BASE_URL not found');
  }

  if (!INDEX_PATTERN_ID) {
    throw new Error('INDEX_PATTERN_ID not found');
  }

  const indexPattern = await fetchIndexPattern(KIBANA_BASE_URL, INDEX_PATTERN_ID);
  const fields = getConflictFields(indexPattern);

  printField(fields);
}

(async () => {
  await main();
})();
