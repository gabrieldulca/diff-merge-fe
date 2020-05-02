import { injectable, inject } from 'inversify';
import { MyService } from '../common';
import { DefaultWorkspaceServer } from '@theia/workspace/lib/node';
import * as fs from 'fs-extra';
import * as url from 'url';

const fetch = require("node-fetch");

@injectable()
export class MyServiceImpl implements MyService {

    constructor(@inject(DefaultWorkspaceServer) private readonly workspaceServer: DefaultWorkspaceServer) {}

    async getEnvVariables(): Promise<Readonly<{ [key:string]: string | undefined }>> {
        return process.env;
    }

    async getSettingValue(): Promise<Readonly<{ [key:string]: string | undefined }>> {
        console.log("getSetting - service");
        let rootPath = await this.workspaceServer.getMostRecentlyUsedWorkspace();
        //const url = require('url');

        const configPath = url.fileURLToPath(rootPath + '/example1.wf');
        console.log("configPath");

        const config = await fs.readJson(configPath);
        console.log(config);

        // @ts-ignore
        let resp = fetch('http://localhost:8080/diff/comparewf/diagram').then(res => res.json());
        console.log("resp", resp);
        //return fetch('http://localhost:8080/diff/compare/diagram/inheritance');




        return resp;

        /*return new Promise(async function(resole, reject) {
            const url = require('url');
            const configPath = url.fileURLToPath(rootPath + '/.setting-test/setting-test.json');
            // const config = require(configPath);
            // const config = fs.readJSONSync(configPath);
            // resole(config.test);

            const config = await fs.readJson(configPath);
            resole(config.test);
        });*/
    }
}
