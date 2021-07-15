namespace Commands {
    export interface Info<H = any> {
        name: string;
        description?: string;
        args?: string;
        call: (args: string[]) => void,
        historyCall?: (action: HistoryAction, data: H) => void;
    }

    export interface ServerInfo<T = any, R = null, H = any, HR = H> extends Info<H> {
        name: string;
        server: (client: NetworkClient, data: T) => R;
        call: (args: string[]) => T | void;
        historyServer?: (client: NetworkClient, action: HistoryAction, data: H) => void;
        historyCall?: (action: HistoryAction, data: H) => HR | void;
    }

    const list: Dict<Info | ServerInfo> = {};

    function getInfo(info: Info | ServerInfo): Info | ServerInfo {
        info.description = info.description || "";
        info.args = info.args || "";
        return info;
    }
    export function register<T, R = void>(info: ServerInfo<T, R>): void;
    export function register(info: Info): void
    export function register<T = any, R = void>(info: Info | ServerInfo<T, R>): void {
        if (has(info.name))
            throw new Error(`Command "${info.name}" was been register`);

        list[info.name] = getInfo(info);
    }
    export function has(name: string): boolean {
        return list.hasOwnProperty(name);
    }
    export function invoke(name: string, cmd: string[]): void {
        const command = get(name);
        if (!command) throw new Error(`Command "${name}" not been register`);

        const data = command.call(cmd);
        if (data) {
            Network.sendToServer("worldedit.invokeServerCommand", {
                command: name,
                data: data
            });
        }
    }

    export function get(name: string): Info | ServerInfo | null {
        return list[name] || null;
    }

    export function getListCommands(): Dict<Info> {
        return copyRecObject(list);
    }
}

Callback.addCallback("NativeCommand", function (command) {
    if (!WorldEdit.enabled()) return;

    const cmd = command.split(" ");
    const nameCmd = cmd[0];
    if (Commands.has(nameCmd)) {
        cmd.shift();
        Commands.invoke(nameCmd, cmd);
        Game.prevent();
    }
});

Network.addServerPacket<HistoryItem>("worldedit.invokeServerCommand", function (client, data) {
    const cmd = <Commands.ServerInfo>Commands.get(data.command);
    const undoData = cmd.server(client, data.data);
    if (undoData)
        WorldEdit.History.send(client, { command: cmd.name, data: undoData });
});
