import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const program = new Command();

program
  .name('smart-translate')
  .description('AI-Powered Smart Code Translator CLI Tool')
  .version('1.0.0');

program
  .requiredOption('-s, --source <language>', 'Source language (python, javascript, typescript, java, cpp, go)')
  .requiredOption('-t, --target <language>', 'Target language (python, javascript, typescript, java, cpp, go)')
  .requiredOption('-i, --input <path>', 'Input file or directory path')
  .option('-o, --output <path>', 'Output file or directory path')
  .option('-a, --api <url>', 'Backend API URL', 'http://localhost:5000/api')
  .option('--test', 'Generate automated unit test stubs', false)
  .option('--preserve-comments', 'Preserve inline comments during translation', true)
  .action(async (options) => {
    try {
      console.log(`\n🚀 Smart Code Translator CLI`);
      console.log(`-----------------------------------------`);
      console.log(`Source Language : ${options.source}`);
      console.log(`Target Language : ${options.target}`);
      console.log(`Input Path      : ${options.input}`);
      
      const inputPath = path.resolve(process.cwd(), options.input);

      if (!fs.existsSync(inputPath)) {
        console.error(`❌ Error: Input path "${inputPath}" does not exist.`);
        process.exit(1);
      }

      const stat = fs.statSync(inputPath);

      if (stat.isFile()) {
        await translateFile(inputPath, options);
      } else if (stat.isDirectory()) {
        await translateDirectory(inputPath, options);
      }
    } catch (err) {
      console.error(`❌ Execution Error: ${err.message}`);
      process.exit(1);
    }
  });

async function translateFile(filePath, options) {
  console.log(`\n📄 Processing file: ${filePath}`);
  const code = fs.readFileSync(filePath, 'utf-8');

  try {
    const response = await axios.post(`${options.api}/code/translate`, {
      code,
      sourceLang: options.source,
      targetLang: options.target,
      options: {
        preserveComments: options.preserveComments,
        includeTests: options.test,
      },
    });

    if (response.data && response.data.success) {
      const { translatedCode, astData, testStubs, metrics } = response.data.data;

      let outputPath = options.output;
      if (!outputPath) {
        const ext = getExtensionForLang(options.target);
        const parsed = path.parse(filePath);
        outputPath = path.join(parsed.dir, `${parsed.name}_translated.${ext}`);
      } else {
        outputPath = path.resolve(process.cwd(), outputPath);
      }

      // Ensure directory exists
      const outDir = path.dirname(outputPath);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, translatedCode, 'utf-8');
      console.log(`✅ Translation Complete! Written to: ${outputPath}`);
      console.log(`📊 Metrics: Latency: ${metrics.latencyMs}ms | AST Nodes: ${metrics.astNodesParsed}`);

      if (testStubs && options.test) {
        const testPath = path.join(outDir, `${path.parse(outputPath).name}.test.${getExtensionForLang(options.target)}`);
        fs.writeFileSync(testPath, testStubs, 'utf-8');
        console.log(`🧪 Test Stub Generated: ${testPath}`);
      }
    }
  } catch (apiErr) {
    console.error(`❌ API Error: ${apiErr.response?.data?.error || apiErr.message}`);
  }
}

async function translateDirectory(dirPath, options) {
  console.log(`\n📁 Processing directory batch: ${dirPath}`);
  const files = getAllFiles(dirPath);
  const srcExt = getExtensionForLang(options.source);

  const targetFiles = files.filter(f => f.endsWith(`.${srcExt}`));
  console.log(`Found ${targetFiles.length} files matching .${srcExt}`);

  for (const file of targetFiles) {
    const relative = path.relative(dirPath, file);
    const targetExt = getExtensionForLang(options.target);
    const outRelative = relative.replace(new RegExp(`\\.${srcExt}$`), `.${targetExt}`);
    
    const outDir = options.output ? path.resolve(process.cwd(), options.output) : path.join(dirPath, 'translated');
    const targetPath = path.join(outDir, outRelative);

    await translateFile(file, { ...options, output: targetPath });
  }
}

function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

function getExtensionForLang(lang) {
  const l = (lang || '').toLowerCase();
  switch (l) {
    case 'python': case 'py': return 'py';
    case 'javascript': case 'js': return 'js';
    case 'typescript': case 'ts': return 'ts';
    case 'java': return 'java';
    case 'cpp': case 'c++': return 'cpp';
    case 'csharp': case 'cs': case 'c#': return 'cs';
    case 'c': return 'c';
    case 'go': return 'go';
    case 'rust': case 'rs': return 'rs';
    case 'sql': return 'sql';
    case 'php': return 'php';
    case 'swift': return 'swift';
    case 'kotlin': case 'kt': return 'kt';
    default: return l || 'txt';
  }
}

program.parse(process.argv);
