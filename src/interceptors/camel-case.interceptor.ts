import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { isObject, isArray, camelCase } from "lodash";

@Injectable()
export class CamelCaseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        return this.transformToCamelCase(data);
      }),
    );
  }

  private transformToCamelCase(data: any): any {
    if (isArray(data)) {
      return data.map((item) => this.transformToCamelCase(item));
    }

    if (isObject(data) && data !== null && !(data instanceof Date)) {
      return Object.keys(data).reduce((acc, key) => {
        const newKey = camelCase(key);
        acc[newKey] = this.transformToCamelCase(data[key]);
        return acc;
      }, {});
    }

    return data;
  }
}
