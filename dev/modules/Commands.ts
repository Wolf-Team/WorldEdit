interface SendServerCommand<T = any> {
    command: string,
    data: T
}
namespace Commands {
    export interface Info {
        name: string;
        description?: string;
        args?: string;
        call: (args: string[]) => void,
        historyCall?: (action: WorldEdit.HistoryAction, data: any) => void
    }

    export interface ServerInfo<T = any, R = null> extends Info {
        name: string;
        server: (client: NetworkClient, data: T) => R;
        call: (args: string[]) => T | void;
        historyCall?: (action: WorldEdit.HistoryAction, data: any) => void
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
    const cmd = command.split(" ");
    const nameCmd = cmd[0];
    if (Commands.has(nameCmd)) {
        cmd.shift();
        Commands.invoke(nameCmd, cmd);
        Game.prevent();
    }
});

Network.addServerPacket<SendServerCommand>("worldedit.invokeServerCommand", function (client, data) {
    const cmd = <Commands.ServerInfo>Commands.get(data.command);
    const undoData = cmd.server(client, data.data);
    if (undoData)
        client.send("worldedit.undoData", { command: cmd.name, data: undoData });
});
Network.addClientPacket<SendServerCommand>("worldedit.undoData", function(data){
    WorldEdit.History.push(data.command, data.data);
});
