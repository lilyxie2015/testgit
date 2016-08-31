#-*- encoding: gb2312 -*- 
import xlrd
import xlwt
import os
import re
import sys
import json
import requests
import pyodbc

reload(sys)
sys.setdefaultencoding( "utf-8" ) 

def read_ini():

    
    paramdict = dict()
    for line in open('config.ini', "r"):  
        if line.strip().startswith('#') or line.strip() == '' :
            continue

        k = line.split('=',1)[0].strip()
        v = line.split('=',1)[1].strip()
        if k == 'name':
            paramdict[v] = ''
            name = v
        if k == 'host':
            paramdict[name] = v
    return paramdict
    
def replace_param_in_path(path,param):
    m = re.search('{(.*?)}', path)
    while m:
       innerparamlist = param.split('&')
       for singleparam in innerparamlist:
           kvlist = singleparam.split('=',1)
           if m.group(1) == kvlist[0]:      
               path = path.replace('{'+m.group(1)+'}',kvlist[1])
       m = re.search('{(.*?)}', path)
       
    return path    
    

def init_case_from_execl(execlfile,workpath):        
    
    conn = pyodbc.connect("DRIVER=SQL Server;SERVER=112.124.233.226,3433;DATABASE=eshinetest;UID=downtowntest;PWD=downtown_2014")
    cursor = conn.cursor()
    
    wb = xlrd.open_workbook(execlfile,formatting_info=True)
    for sheet in wb.sheets():
        execlpath = os.path.dirname(execlfile)
        f = open(workpath+'\\'+sheet.name+'.txt','w')
        host = read_ini()[sheet.name]
        f.write("*** Settings ***\nLibrary           RequestsLibrary\nLibrary           Collections\n"+
              "Library           DatabaseLibrary\nLibrary           MyLibrary\nResource          User Keyword.txt\n\n"+
              "*** Variables ***\n${host}           " + host + "\n\n"+
              "*** Test Cases ***\n")
        nrows = sheet.nrows
        apitimes = dict()
        
        for rownum in range(1,nrows):
            
            row = sheet.row_values(rownum)

            originpath = row[0]
            method = row[1]
            param = row[2].split('=',1)[0]
            execldatafile = execlpath + row[2].split('=',1)[1]
            
            innerwb = xlrd.open_workbook(execldatafile)
            innersheet = innerwb.sheet_by_index(0)
            if innersheet.nrows == 0 or innersheet.nrows == 1 :
                continue
            innerfirstrow = innersheet.row_values(0)
            divisionindex = innerfirstrow.index('ParseLayer')
            innerparamlist = innerfirstrow[0:divisionindex]
            
            for innerrownum in range(1,innersheet.nrows):
                path = row[0]
                checklist = list()
                
                tempdict = dict()
                innerrow = innersheet.row_values(innerrownum)
                paramforrequest = ''
                paramlist = param.split('&')
                
                if innerrow[0] == '':
                    break
                if innerrow[0] == '..':
                    continue
                for colindex in range(divisionindex):

                    value = innerrow[colindex]
                    if ( type(value) == float ):
                        if ( value == int(value) ):
                            value = int(value)
                    if str(value).lower().strip().startswith('select'):
                            cursor.execute(value)
                            queryresult = cursor.fetchone()
                            if queryresult is not None:
                                value = queryresult[0]
                            else:
                                print value
                                print 'the query sql has no result,please chec'
                            value = queryresult[0]
                    if innerparamlist[colindex] not in paramlist:
                        tempdict[innerparamlist[colindex]] = value
                    else :
                        paramforrequest += innerparamlist[colindex] + '=' + str(value) + '&'
                        paramlist.remove(innerparamlist[colindex])
                    
                if len(paramlist) != 0:
                    paramforrequest += paramlist[0] +"="+ str(tempdict)
                else:
                    paramforrequest = paramforrequest[0:len(paramforrequest)-1]
                path = replace_param_in_path(path,paramforrequest)
                
                finalparam = paramforrequest.replace('\'','\"')
                finalparam = finalparam.replace('u\"','\"')
                
                parselayer = innerrow[divisionindex]
                if parselayer == '':
                    parselayer = '()'
                expectvalue = innerrow[divisionindex+1]
                expectvalue = expectvalue.replace('\n','').replace(' ','')
                querysql = innerrow[divisionindex + 2]
                oldvalue = innerrow[divisionindex + 3]
                newvalue = innerrow[divisionindex + 4]
                casename = originpath+' '+method
                if apitimes.has_key(casename):
                    if apitimes[casename] == '' :
                        apitimes[casename] = "1"
                    else :
                        apitimes[casename] = str(int(apitimes[casename]) + 1 )
                else :
                    apitimes[casename] = ''
                
                f.write(originpath+' '+method+str(apitimes[casename])+'\n')                 
                f.write('    ${path}    set variable    '+path+'\n')
                f.write('    ${method}    set variable    '+method+'\n')
                f.write('    ${param}    set variable    '+finalparam+'\n')
                f.write('    ${parselayer}    set variable    '+parselayer+'\n')
                f.write('    ${querysql}    set variable    '+querysql+'\n')
                if oldvalue != '' or newvalue != '':
                    f.write('    compare to given value    '+querysql+'    '+oldvalue+'\n')
                    checklist.append('    compare to given value    '+querysql+'    '+newvalue+'\n')
                    nextrow = innerrownum +1

                    while nextrow < innersheet.nrows and innersheet.row_values(nextrow)[0] == '..':
                        f.write('    compare to given value    '+innersheet.row_values(nextrow)[divisionindex + 1]+'    '+innersheet.row_values(nextrow)[divisionindex + 2]+'\n')
                        checklist.append('    compare to given value    '+innersheet.row_values(nextrow)[divisionindex + 1]+'    '+innersheet.row_values(nextrow)[divisionindex + 3]+'\n')
                        nextrow += 1
                f.write('    ${responses}    httprequest    ${method}    ${host}    ${path}    ${param}'+'\n')
                f.write('    ${innerdata}    parse json    ${responses}    ()'+'\n')
                f.write('    ${innerlist}    parse json    ${responses}    ${parselayer}'+'\n')
                if expectvalue != '':
                    f.write('    compare to expect value    ${innerdata}    '+expectvalue+'\n')
                
                if querysql != '' and oldvalue =='' and newvalue == '':
                    
                    f.write('    compare to db    ${innerlist}    ${querysql}\n')
                for strdata in checklist:
                    f.write(strdata)
                    
        f.close
    conn.close
        

if __name__ == '__main__':

    homedir = os.path.dirname(os.path.abspath(sys.argv[0]))
    os.chdir(homedir)

    if not os.path.exists('apitest') :
        os.mkdir('apitest')
    
    execlfile = './testdata/indexfile.xls'
    path = './apitest'
    init_case_from_execl(execlfile,path)