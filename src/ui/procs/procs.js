import { id, RenderProgress } from "../shared.js";

class CProcesses {
	constructor() {
		/** @type {import("../../../types/preload").IProcess[]} */
		this.m_vecProcesses = [];
	}

	async Render() {
		this.m_vecProcesses = electron.GetProcesses();
		const elList = pElements.elList;
		const vecSortedProcesses = this.m_vecProcesses.sort(
			(a, b) => b.pid - a.pid,
		);

		elList.innerHTML = "";
		for (const proc of vecSortedProcesses) {
			const elEntry = pElements.elEntry.content.cloneNode(true);
			const elEntryContainer = elEntry.children[0];

			const [elEntryPID, elEntryCmd, elEntryArgs] = [
				...elEntryContainer.children,
			];
			const { pid: unPID, args: vecArgs } = proc;

			elEntryPID.innerText = unPID;
			elEntryCmd.innerText = proc.cmd.split("/").splice(-1)[0];
			elEntryArgs.innerText = vecArgs.join(" ");
			elEntryArgs.title = vecArgs.join("\n");

			elEntryContainer.addEventListener("dblclick", async () => {
				process.kill(proc.pid);
				container.remove();
			});

			pElements.elList.appendChild(elEntry);
		}
	}
}

class CResourceUsage {
	constructor() {
		this.m_flCPUUsage = 0;
		this.m_flRAMUsage = 0;
		this.m_vecPrevCPUUsage = [0, 0, 0, 0, 0, 0, 0, 0];
	}

	UpdateUsage() {
		const read_file = (name) =>
			[...fs.readFileSync(name)].map((e) => String.fromCharCode(e)).join("");
		const cpu = read_file("/proc/stat")
			.split("\n")[0]
			.split(/\s+/)
			.splice(1)
			.map((e) => Number(e));
		const ram = read_file("/proc/meminfo")
			.split("\n")
			.filter((e) => e.startsWith("MemTotal") || e.startsWith("MemAvailable"))
			.map((e) => Number(e.split(/\s+/)[1]));

		// CPU
		{
			let [
				prev_user,
				prev_nice,
				prev_sys,
				prev_idle,
				prev_io_wait,
				prev_irq,
				prev_soft_irq,
				prev_steal,
			] = this.m_vecPrevCPUUsage;
			let [user, nice, sys, idle, io_wait, irq, soft_irq, steal] = cpu;
			this.m_vecPrevCPUUsage = cpu;

			prev_idle += prev_io_wait;
			idle += io_wait;

			const prev_non_idle =
				prev_user +
				prev_nice +
				prev_sys +
				prev_irq +
				prev_soft_irq +
				prev_steal;
			const non_idle = user + nice + sys + irq + soft_irq + steal;

			const prev_total = prev_idle + prev_non_idle;
			const total = idle + non_idle;

			const totald = total - prev_total;
			const idled = idle - prev_idle;

			this.m_flCPUUsage = (totald - idled) / totald;
		}

		// RAM
		{
			const [total, available] = ram;

			this.m_flRAMUsage = 1 - available / total;
		}
	}

	async Render() {
		RenderProgress(pElements.elUsageCPU, this.m_flCPUUsage);
		RenderProgress(pElements.elUsageMemory, this.m_flRAMUsage);
	}
}

let pElements = null;
const pProcesses = new CProcesses();
const pResourceUsage = new CResourceUsage();

function RenderEverything() {
	if (!pElements.elListContainer.hidden) {
		pProcesses.Render();
	}

	pResourceUsage.UpdateUsage();
	pResourceUsage.Render();
}

document.addEventListener("DOMContentLoaded", async () => {
	pElements = {
		elListContainer: id("proc-list-container"),
		elList: id("proc-list"),
		elEntry: id("proc-entry"),

		elUsageCPU: id("procs-usage-cpu"),
		elUsageMemory: id("procs-usage-memory"),
	};

	RenderEverything();
	setInterval(() => {
		RenderEverything();
	}, k_unUpdateInterval);
});
