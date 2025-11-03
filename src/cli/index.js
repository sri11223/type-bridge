/**
 * CLI Interface
 * 
 * Command-line interface for type-bridge
 */

const { Command } = require('commander');
const chalk = require('chalk');
const prompts = require('prompts');
const path = require('path');
const fs = require('fs-extra');
const { generateTypes, detectORM } = require('../core/generator');
const { loadConfig, DEFAULT_CONFIG } = require('../config/config-manager');
const { watchWithGeneration } = require('../watchers/file-watcher');
const { handleError } = require('../errors/error-handler');
const { cleanGeneratedFiles } = require('../writers/file-writer');

const program = new Command();
const packageJson = require('../../package.json');

/**
 * Init command - Setup wizard
 */
program
  .command('init')
  .description('Initialize type-bridge configuration')
  .option('--force', 'Overwrite existing config')
  .action(async (options) => {
    try {
      console.log(chalk.cyan.bold('\n🌉 Type-Bridge Setup\n'));

      const projectRoot = process.cwd();
      const configPath = path.join(projectRoot, 'type-bridge.config.json');

      // Check if config already exists
      if (await fs.pathExists(configPath) && !options.force) {
        console.log(chalk.yellow('⚠️  Config file already exists!'));
        console.log(chalk.gray(`Use --force to overwrite\n`));
        return;
      }

      // Detect ORM
      console.log(chalk.gray('Detecting ORM...'));
      const detectedORM = await detectORM(projectRoot);

      // Interactive prompts
      const answers = await prompts([
        {
          type: 'select',
          name: 'orm',
          message: 'Which ORM are you using?',
          choices: [
            { title: 'Auto-detect', value: 'auto' },
            { title: 'Prisma', value: 'prisma' },
            { title: 'Mongoose', value: 'mongoose' },
            { title: 'TypeORM', value: 'typeorm', disabled: true },
            { title: 'Sequelize', value: 'sequelize', disabled: true }
          ],
          initial: detectedORM ? (detectedORM === 'prisma' ? 1 : 2) : 0
        },
        {
          type: (prev) => prev === 'mongoose' ? 'text' : null,
          name: 'modelsPath',
          message: 'Where are your Mongoose models?',
          initial: './models'
        },
        {
          type: (prev, answers) => answers.orm === 'prisma' ? 'text' : null,
          name: 'schemaPath',
          message: 'Where is your Prisma schema?',
          initial: './prisma/schema.prisma'
        },
        {
          type: 'text',
          name: 'outputPath',
          message: 'Where should types be generated?',
          initial: './types'
        },
        {
          type: 'select',
          name: 'outputMode',
          message: 'Output mode?',
          choices: [
            { title: 'Single file (all types in one file)', value: 'single' },
            { title: 'Separate files (one file per model)', value: 'separate' }
          ],
          initial: 0
        },
        {
          type: 'confirm',
          name: 'watch',
          message: 'Enable watch mode by default?',
          initial: true
        }
      ]);

      if (!answers.orm) {
        console.log(chalk.yellow('\n❌ Setup cancelled\n'));
        return;
      }

      // Create config
      const config = {
        ...DEFAULT_CONFIG,
        orm: answers.orm,
        modelsPath: answers.modelsPath || DEFAULT_CONFIG.modelsPath,
        schemaPath: answers.schemaPath || DEFAULT_CONFIG.schemaPath,
        outputPath: answers.outputPath,
        outputMode: answers.outputMode,
        watch: answers.watch
      };

      // Save config
      await fs.writeJson(configPath, config, { spaces: 2 });

      console.log(chalk.green('\n✅ Configuration saved!'));
      console.log(chalk.gray(`Config: ${configPath}\n`));

      // Show next steps
      console.log(chalk.cyan('📋 Next steps:\n'));
      console.log(chalk.white('  1. Generate types:'));
      console.log(chalk.gray('     npx type-bridge generate\n'));
      console.log(chalk.white('  2. Or start watch mode:'));
      console.log(chalk.gray('     npx type-bridge watch\n'));

    } catch (error) {
      handleError(error);
    }
  });

/**
 * Generate command - One-time generation
 */
program
  .command('generate')
  .description('Generate TypeScript types from schemas')
  .option('--config <path>', 'Path to config file')
  .option('--output <path>', 'Output path (overrides config)')
  .option('--dry-run', 'Preview without writing files')
  .option('--only <models>', 'Generate specific models (comma-separated)')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      console.log(chalk.cyan('⚙️  Generating types...\n'));
      // Load config
      const config = await loadConfig({
        configPath: options.config,
        overrides: {
          outputPath: options.output
        }
      });

      if (options.verbose) {
        console.log(chalk.gray('Configuration loaded'));
        console.log(chalk.gray(JSON.stringify(config, null, 2)));
      }

      // Generate
      const result = await generateTypes(config);

      if (!result.success) {
        console.error(chalk.red(`❌ Generation failed`));
        console.error(chalk.red(`\n${result.error}\n`));
        process.exit(1);
      }

      // Show results
      console.log(chalk.green(`\n✅ Generated ${result.modelsCount} models`));
      console.log(chalk.gray(`ORM: ${result.orm}`));
      console.log(chalk.gray(`Output: ${result.outputPath}\n`));

      if (options.verbose) {
        console.log(chalk.cyan('Models:'));
        result.models.forEach(model => {
          console.log(chalk.gray(`  - ${model}`));
        });
        console.log();
      }

    } catch (error) {
      console.error(chalk.red('❌ Generation failed'));
      handleError(error, { verbose: options.verbose });
    }
  });

/**
 * Watch command - Watch mode with auto-regeneration
 */
program
  .command('watch')
  .description('Watch schemas and auto-generate types on changes')
  .option('--config <path>', 'Path to config file')
  .option('--output <path>', 'Output path (overrides config)')
  .action(async (options) => {
    try {
      console.log(chalk.cyan.bold('\n🌉 Type-Bridge Watch Mode\n'));

      // Load config
      const config = await loadConfig({
        configPath: options.config,
        overrides: {
          outputPath: options.output
        }
      });

      // Start watching
      await watchWithGeneration(config, {
        onRegenerate: (result) => {
          console.log(chalk.gray(`Generated ${result.modelsCount} models`));
        },
        onError: (error) => {
          console.error(chalk.red(`Error: ${error.message}`));
        }
      });

    } catch (error) {
      handleError(error);
    }
  });

/**
 * Verify command - Check sync status
 */
program
  .command('verify')
  .description('Verify types are in sync with schemas')
  .option('--config <path>', 'Path to config file')
  .action(async (options) => {
    try {
      console.log(chalk.cyan('🔍 Verifying type synchronization...\n'));
      
      const config = await loadConfig({ configPath: options.config });
      const outputPath = path.resolve(config.projectRoot || process.cwd(), config.outputPath || './types');

      // Check if output files exist
      if (!await fs.pathExists(outputPath)) {
        console.log(chalk.red('❌ Generated types not found!'));
        console.log(chalk.gray(`   Expected at: ${outputPath}`));
        console.log(chalk.yellow('\n💡 Run: typeweaver generate\n'));
        process.exit(1);
      }

      // Read current generated files
      const outputFile = path.join(outputPath, 'index.ts');
      if (!await fs.pathExists(outputFile)) {
        console.log(chalk.red('❌ Generated types file not found!'));
        console.log(chalk.gray(`   Expected: ${outputFile}`));
        process.exit(1);
      }

      const existingContent = await fs.readFile(outputFile, 'utf-8');

      // Generate types in memory
      console.log(chalk.gray('Generating types from current schema...'));
      const result = await generateTypes(config);

      if (!result.success) {
        console.log(chalk.red(`❌ Failed to generate types: ${result.error}`));
        process.exit(1);
      }

      // Compare content (removing timestamps and auto-generated comments)
      const normalize = (content) => content
        .replace(/Generated: .+/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const existingNormalized = normalize(existingContent);
      const newNormalized = normalize(result.generatedContent || '');

      if (existingNormalized === newNormalized) {
        console.log(chalk.green('✅ Types are in sync with schemas!\n'));
        process.exit(0);
      } else {
        console.log(chalk.yellow('⚠️  Types are OUT OF SYNC with schemas!'));
        console.log(chalk.gray('\n   Schema has changed since types were last generated.'));
        console.log(chalk.yellow('\n💡 Run: typeweaver generate\n'));
        process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red('❌ Verification failed'));
      handleError(error);
      process.exit(1);
    }
  });

/**
 * Clean command - Remove generated files
 */
program
  .command('clean')
  .description('Remove all generated type files')
  .option('--config <path>', 'Path to config file')
  .option('--dry-run', 'Preview without deleting')
  .action(async (options) => {
    try {
      const config = await loadConfig({ configPath: options.config });

      console.log(chalk.yellow('\n🧹 Cleaning generated files...\n'));

      const result = await cleanGeneratedFiles(config.outputPath, {
        dryRun: options.dryRun
      });

      if (result.success) {
        if (options.dryRun) {
          console.log(chalk.gray(`Would delete ${result.files.length} files:`));
          result.files.forEach(file => {
            console.log(chalk.gray(`  - ${file}`));
          });
        } else {
          console.log(chalk.green(`✅ Deleted ${result.deletedCount} files\n`));
        }
      } else {
        console.error(chalk.red(`❌ ${result.error}\n`));
      }

    } catch (error) {
      handleError(error);
    }
  });

/**
 * Info command - Show configuration
 */
program
  .command('info')
  .description('Show current configuration')
  .option('--config <path>', 'Path to config file')
  .action(async (options) => {
    try {
      const config = await loadConfig({ configPath: options.config });

      console.log(chalk.cyan('\n📋 Current Configuration:\n'));
      console.log(chalk.white('ORM:'), chalk.gray(config.orm));
      console.log(chalk.white('Output:'), chalk.gray(config.outputPath));
      console.log(chalk.white('Mode:'), chalk.gray(config.outputMode));
      console.log(chalk.white('Watch:'), chalk.gray(config.watch ? 'enabled' : 'disabled'));
      
      if (config.orm === 'mongoose') {
        console.log(chalk.white('Models:'), chalk.gray(config.modelsPath));
      }
      
      if (config.orm === 'prisma') {
        console.log(chalk.white('Schema:'), chalk.gray(config.schemaPath));
      }
      
      console.log(chalk.white('Config:'), chalk.gray(config.configPath || 'none'));
      console.log();

    } catch (error) {
      handleError(error);
    }
  });

/**
 * Program setup
 */
program
  .name('type-bridge')
  .description('Auto-generate TypeScript types from your ORM schemas')
  .version(packageJson.version);

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

module.exports = program;
