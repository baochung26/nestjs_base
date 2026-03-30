import { PipeTransform, Injectable } from '@nestjs/common';

/**
 * TrimPipe để trim whitespace từ strings
 * Có thể dùng cho body, query, params
 */
@Injectable()
export class TrimPipe implements PipeTransform {
  private readonly fieldsToTrim: string[];

  constructor(fieldsToTrim?: string[]) {
    this.fieldsToTrim = fieldsToTrim || [];
  }

  transform(value: any) {
    if (typeof value !== 'object' || value === null) {
      return value;
    }

    // Nếu có fieldsToTrim, chỉ trim các fields đó
    if (this.fieldsToTrim.length > 0) {
      return this.trimSpecificFields(value, this.fieldsToTrim);
    }

    // Nếu không có fieldsToTrim, trim tất cả string fields
    return this.trimAllStrings(value);
  }

  private trimSpecificFields(obj: any, fields: string[]): any {
    const result = { ...obj };
    for (const field of fields) {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = result[field].trim();
      }
    }
    return result;
  }

  private trimAllStrings(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.trimAllStrings(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'string') {
            result[key] = obj[key].trim();
          } else if (typeof obj[key] === 'object') {
            result[key] = this.trimAllStrings(obj[key]);
          } else {
            result[key] = obj[key];
          }
        }
      }
      return result;
    }

    return obj;
  }
}
