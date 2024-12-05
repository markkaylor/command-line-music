// TODO fix the import to point to the TS file
import {playlist, type Track} from './playlist.js';
import {ChildProcess, spawn} from 'child_process';
import path from 'path';
import {fileURLToPath} from 'url';
import createSoundPlayer from 'play-sound';
import treeKill from 'tree-kill';
import type {Result as Cli} from 'meow';

import * as React from 'react';
import {Text, Box} from 'ink';
import SelectInput from 'ink-select-input';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const player = createSoundPlayer();

type AppProps = {
	cli: Cli<{}>;
};

export default function App(props: AppProps) {
	const [currentTrack, setCurrentTrack] = React.useState<Track>();
	const [logs, setLogs] = React.useState('');
	const [audio, setAudio] = React.useState<ChildProcess | null>(null);

	/**
	 * Selects a random track to play next excluding the previous track
	 *
	 * TODO:
	 * - Never play the same track twice in a row
	 * - Or, shuffle the playlist on each iteration and always start from the beginning
	 */
	const playMusic = (previousTrack?: Track) => {
		// Filter out the previous track
		const playlistWithoutPreviousTrack = previousTrack
			? playlist.filter(track => track.fileName !== previousTrack.fileName)
			: playlist;
		// Select a track randomly
		const randomIndex = Math.floor(
			Math.random() * playlistWithoutPreviousTrack.length,
		);
		const track = playlistWithoutPreviousTrack[randomIndex];

		// Parse the track's path
		const trackFilePath = path.join(
			__dirname,
			'..',
			'music',
			track?.fileName ?? '',
		);
		// Start playing the music at path
		const audio = player.play(trackFilePath, err => {
			if (err) {
				console.error(`Error playing track: ${err.message}`);
			}

			if (!audio.killed) {
				// When the process is still running and a track ends,
				// recurse to play another random track.
				playMusic(track);
			}
		});

		// Set the state for the UI
		setAudio(audio);
		setCurrentTrack(track);

		return audio;
	};

	/**
	 * Controls
	 */
	const controls = [
		{
			label: audio?.killed ? 'Play' : 'Stop',
			value: audio?.killed ? 'play' : 'stop',
		},
		{
			label: 'New song',
			value: 'new-song',
		},
		{
			label: 'Exit',
			value: 'exit',
		},
	];
	const handleSelectControl = (option: {value: string}) => {
		if (option.value === 'stop') {
			if (audio) {
				audio.kill();
			}
		}

		if (option.value === 'new-song' || option.value === 'play') {
			if (audio) {
				audio.kill();
				playMusic(currentTrack);
			}
		}

		if (option.value === 'exit') {
			if (audio) {
				audio.kill();
			}
			process.exit(0);
		}
	};

	React.useEffect(() => {
		/**
		 * Parse the commands
		 */
		const commands = props.cli.input;
		if (commands.length === 0) {
			console.error(
				'Did you forget your command? Try something like: clm yarn install',
			);
			process.exit(1);
		}

		/**
		 * Start the audio child process
		 */
		const audioProcess = playMusic();

		/**
		 * Spawn the user's commands child process
		 * Pipe the output to the parent process so it can be displayed in the UI
		 */
		const userCommandsProcess = spawn(commands.join(' '), {
			shell: true,
			stdio: 'pipe',
		});
		// Capture stdout (standard output) from the child process
		userCommandsProcess.stdout.on('data', data => {
			setLogs(prevLogs => {
				const newLogs = prevLogs + data.toString();
				if (newLogs !== prevLogs) {
					// Only update if the logs have changed
					return newLogs;
				}

				return prevLogs;
			});
		});
		// Capture stderr (standard error) from the child process
		userCommandsProcess.stderr.on('data', data => {
			setLogs(prevLogs => {
				const newLogs = prevLogs + `\nERROR: ${data.toString()}`;
				if (newLogs !== prevLogs) {
					// Only update if the logs have changed
					return newLogs;
				}

				return prevLogs;
			});
		});

		/**
		 * Cleanup
		 *
		 * Kill all processes started from the top down.
		 * This is important since the user's command can spawn a child process,
		 * which could start other processes.
		 *
		 * For example, the child process may have started a development server,
		 * this cleanup function ensures the process is killed.
		 */
		const cleanup = async () => {
			// Prevent multiple cleanup calls
			if (process.exitCode !== undefined) {
				return;
			} else {
				process.exitCode = 0;
			}

			// Kill audio process
			if (!audioProcess.killed) {
				try {
					audioProcess.kill();
				} catch (err) {
					console.error('Failed to kill audio process:', err);
					process.exitCode = 1;
				}
			}

			// Kill the user command and any processes it spawned
			if (userCommandsProcess.pid) {
				try {
					await new Promise((resolve, reject) => {
						treeKill(userCommandsProcess.pid!, err => {
							if (err) reject(err);
							else resolve(undefined);
						});
					});
					userCommandsProcess.kill();
				} catch (err) {
					console.error('Error killing process tree:', err);
					process.exitCode = 1;
				}
			}

			process.exit(process.exitCode);
		};
		// When the command naturally finishes
		userCommandsProcess.on('exit', () => {
			cleanup().catch(err => {
				console.error('Error during exit cleanup:', err);
				process.exit(1);
			});
		});
		// When user hits Ctrl+C
		process.on('SIGINT', () => {
			cleanup().catch(err => {
				console.error('Error during SIGINT cleanup:', err);
				process.exit(1);
			});
		});
		// When the process receives a termination signal
		process.on('SIGTERM', () => {
			cleanup().catch(err => {
				console.error('Error during SIGTERM cleanup:', err);
				process.exit(1);
			});
		});
		// When the React component unmounts
		return () => {
			cleanup().catch(err => {
				console.error('Error during unmount cleanup:', err);
				process.exit(1);
			});
		};
	}, []);

	return (
		<Box
			flexDirection="column"
			height="100%"
			justifyContent="space-between"
			paddingY={1}
			paddingX={1}
		>
			{/* Logs */}
			<Box flexGrow={1}>
				<Text>{logs}</Text>
			</Box>

			{/* Track info and controls */}
			<Box flexDirection="column" paddingY={1}>
				<Box flexDirection="column">
					<Text inverse bold>
						{currentTrack?.title}
					</Text>
					<Text italic>{currentTrack?.artist}</Text>
				</Box>
				<SelectInput items={controls} onSelect={handleSelectControl} />
			</Box>
		</Box>
	);
}
