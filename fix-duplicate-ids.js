import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取vocabulary.json
const vocabPath = path.join(__dirname, '../wordlist-imported-vocab-v3/vocabulary.json');
const data = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));

console.log('Total words:', data.vocabulary.length);

// 找出所有重复的ID
const idMap = new Map();
const duplicates = new Set();

data.vocabulary.forEach((word, index) => {
  if (idMap.has(word.id)) {
    duplicates.add(word.id);
    console.log(`Duplicate ID ${word.id}: "${idMap.get(word.id)}" and "${word.word}"`);
  } else {
    idMap.set(word.id, word.word);
  }
});

console.log(`\nFound ${duplicates.size} duplicate IDs`);

// 修复重复的ID
let maxId = Math.max(...data.vocabulary.map(w => w.id));
console.log(`Current max ID: ${maxId}`);

const seenIds = new Set();
let fixedCount = 0;

data.vocabulary.forEach((word) => {
  if (seenIds.has(word.id)) {
    // 这是重复的ID，分配新的ID
    maxId++;
    console.log(`Fixing: "${word.word}" from ID ${word.id} to ${maxId}`);
    word.id = maxId;
    fixedCount++;
  }
  seenIds.add(word.id);
});

// 更新userIdCounter
data.userIdCounter = maxId + 1;
console.log(`\nFixed ${fixedCount} duplicate IDs`);
console.log(`New userIdCounter: ${data.userIdCounter}`);

// 备份原文件
const backupPath = vocabPath + '.backup';
fs.copyFileSync(vocabPath, backupPath);
console.log(`\nBackup created: ${backupPath}`);

// 保存修复后的文件
fs.writeFileSync(vocabPath, JSON.stringify(data, null, 2));
console.log(`Fixed file saved: ${vocabPath}`);
