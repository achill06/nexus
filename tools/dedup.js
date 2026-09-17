function buildKey(record, source) {
  if (source === 'remoteok') return String(record.id);
  if (source === 'github')   return record.job_url;
  throw new Error(`Unknown source: ${source}`);
}
function getFields(source){
    if (source === 'remoteok') {
        return ['position', 'company', 'tags', 'location', 'salary_min', 'salary_max', 'apply_url'];
    }
    if (source === 'github') {
        return ['company', 'job_title', 'locations', 'flags'];
    }
    throw new Error(`Unknown source: ${source}`);
}
function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const sortedKeys = Object.keys(value).sort();
  return `{${sortedKeys.map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

function isChanged(oldRecord, newRecord, fields){
    for (const field of fields) {
        const oldValue = oldRecord[field];
        const newValue = newRecord[field];
        if(typeof oldValue === 'object' && newValue !== null && oldValue !== null) {
            if (stableStringify(oldValue) !== stableStringify(newValue)) {
                return true;
            }
        } else if (oldValue !== newValue) {
            return true;
        }
    }
    return false;
}
function compareRecords(newRecords, previousRecords,source){
    const fields = getFields(source);
    const previousMap = new Map(previousRecords.map(record => [buildKey(record, source), record]));
    const toInsert = [];
    const toUpdate = [];
    const unchanged = [];
    for (const newRecord of newRecords) {
        const key = buildKey(newRecord, source);
        const oldRecord = previousMap.get(key);
        if (!oldRecord) {
            toInsert.push(newRecord);
        } else if (isChanged(oldRecord, newRecord, fields)) {
            toUpdate.push({ old: oldRecord, updated: newRecord });
        } else {
            unchanged.push(newRecord);
        }
    }
    return { toInsert, toUpdate, unchanged };
}
module.exports = { buildKey, getFields, isChanged, compareRecords };