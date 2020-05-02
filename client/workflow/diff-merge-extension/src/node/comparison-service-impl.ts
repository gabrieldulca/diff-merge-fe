import { injectable } from 'inversify';
import { ComparisonService } from '../common';

const fetch = require("node-fetch");

@injectable()
export class ComparisonServiceImpl implements ComparisonService {

    async getMergeResult(): Promise<Readonly<{ [key:string]: string | undefined }>> {
        return process.env;
    }

    async getComparisonResult(): Promise<Readonly<{ [key:string]: string | undefined }>> {

        // @ts-ignore
        let resp = fetch('http://localhost:8080/diff/comparewf/diagram').then(res => res.json());
        console.log("getComparisonResult", resp);

        return resp;
    }
}
