import { injectable } from 'inversify';
import { ComparisonService } from '../common';

const fetch = require("node-fetch");

@injectable()
export class ComparisonServiceImpl implements ComparisonService {

    async getMergeResult(file1Path: string, file2Path: string): Promise<Readonly<{ [key:string]: string | undefined }>> {
        return process.env;
    }

    async getComparisonResult(file1Path: string, file2Path: string): Promise<Readonly<{ [key:string]: string | undefined }>> {
        console.log('http://localhost:8080/diff/compare/diagram?file1='+file1Path+'&file2='+file2Path);

        // @ts-ignore
        let resp = fetch('http://localhost:8080/diff/compare/diagram?file1='+file1Path+'&file2='+file2Path)
            .then((res: { json: () => void; }) => res.json())
            .catch((error: any) => {
            console.error('There has been a problem with your fetch operation:', error);
        });
        console.log("getComparisonResult", resp);

        return resp;
    }
}
