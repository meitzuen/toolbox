import json
import argparse
import sys
from pathlib import Path

VAILD_TEST_TYPE = ['Functional Test', 'Force Error Test', 'Boundary Test']
VAILD_TESTCASE_CONDITION = ':'
TEST_TYPE_PREFIX = {"Functional Test": "FN", 'Force Error Test': "FET", 'Boundary Test': "BT"}
IGNORE_TESTCASE_1 = 'PRE'
IGNORE_TESTCASE_2 = 'CHECK'


def rename_testcases_name(postman_collection):
    all_specs = postman_collection['item']
    
    ignore_spec = ["Init"]
    
    for spec in all_specs:
        if spec['name'] in ignore_spec:
            continue
        
        print(spec['name'])
        
        for test_type in spec['item']:
            index = 1
            type_name = test_type['name']
            if type_name in VAILD_TEST_TYPE:
                for test_case in test_type['item']:
                    old_case_name = test_case['name']
                    if old_case_name.startswith(IGNORE_TESTCASE_1) or old_case_name.startswith(IGNORE_TESTCASE_2):
                        continue
                    if VAILD_TESTCASE_CONDITION in old_case_name:
                        prefix = TEST_TYPE_PREFIX[type_name]
                        new_index = f"{prefix}_{index:02d}"
                        _new_case_name =  old_case_name.split(':')[1:]
                        new_case_name = ":".join(_new_case_name)
                        new_name = new_index + ":" + new_case_name
                        
                        test_case['name'] = new_name
                        
                        index +=1

                        
    return all_specs
                

def main():
    parser = argparse.ArgumentParser(description='重新排序 Postman collection 中的測試案例名稱')
    parser.add_argument('input_file', help='輸入的 Postman collection JSON 檔案路徑')
    parser.add_argument('-o', '--output', help='輸出檔案路徑 (預設: new_postman_collection.json)', 
                       default='postman_collection_renamed.json')
    
    args = parser.parse_args()
    
    # 檢查輸入檔案是否存在
    if not Path(args.input_file).exists():
        print(f"錯誤: 找不到檔案 '{args.input_file}'")
        sys.exit(1)
    
    try:
        # 讀取 Postman collection
        with open(args.input_file, 'r', encoding='utf-8') as f:
            postman_collection_json = json.load(f)
        
        # 重新命名測試案例
        renamed_collection_json = rename_testcases_name(postman_collection_json)
        postman_collection_json['item'] = renamed_collection_json
        
        # 寫入新檔案
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(postman_collection_json, f, indent=4, ensure_ascii=False)
        
        print(f"成功處理完成！輸出檔案: {args.output}")
        
    except json.JSONDecodeError:
        print(f"錯誤: '{args.input_file}' 不是有效的 JSON 檔案")
        sys.exit(1)
    except Exception as e:
        print(f"處理過程中發生錯誤: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
