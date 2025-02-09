// @ts-check

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Scans a folder and its subfolders for all files ending in .VOB
 * @param {string} dir - The directory to scan
 * @param {string[]} fileList - The list of .VOB files found
 * @returns {string[]} - The list of .VOB files found
 */
function scanFolder(dir, fileList = []) {
	const files = fs.readdirSync(dir);
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const filePath = path.join(dir, file);
		if (fs.statSync(filePath).isDirectory()) {
			scanFolder(filePath, fileList);
		} else if (
			filePath.endsWith('.VOB') &&
			path.basename(filePath) !== 'VIDEO_TS.VOB'
		) {
			fileList.push(filePath);
		}
	}
	return fileList;
}

const inputFolder = '/Volumes/TOSHIBA 4T/video originali';
const outputFolder = '/Volumes/TOSHIBA 4T/video convertiti';
const vobFiles = scanFolder(inputFolder);

async function processFile(filePath, inputDir, outputDir) {
	return /** @type {Promise<void>} */ (
		new Promise((resolve, reject) => {
			console.log(`Found VOB file: ${filePath}`);
			const relativePath = path.relative(inputDir, filePath);
			const outputPath = path
				.join(outputDir, relativePath)
				.replace(/\.VOB$/i, '.mp4');
			const outputDirPath = path.dirname(outputPath);

			// Crea la directory di output se non esiste
			fs.mkdirSync(outputDirPath, { recursive: true });

			try {
				const handbrake = spawn(
					'HandBrakeCli',
					[
						'-i',
						filePath,
						'-o',
						outputPath,
						'-Z',
						'H.265 Apple VideoToolbox 1080p'
					],
					{ stdio: 'inherit' }
				);

				handbrake.on('close', (code) => {
					if (code !== 0) {
						console.error(`HandBrakeCli process exited with code ${code}`);
						reject(code);
					} else {
						resolve();
					}
				});
			} catch (error) {
				console.error(`Error executing command for ${filePath}:`, error);
			}
		})
	);
}

async function processFiles(files, inputDir, outputDir) {
	const errors = [];
	for (let i = 0; i < files.length; i++) {
		console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
		console.log('Processing file', i + 1, 'of', files.length);
		console.log('');
		console.log('');
		console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
		const filePath = files[i];
		try {
			await processFile(filePath, inputDir, outputDir);
		} catch (e) {
			errors.push(filePath);
		}
	}
	console.log('Processing complete ✅');

	if (errors.length > 0) {
		console.error('The following files failed to process:', errors);
	}
}

processFiles(vobFiles, inputFolder, outputFolder);
