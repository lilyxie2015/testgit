#-*- encoding: gb2312 -*- 
import HTMLParser  
  
class MyHTMLParser(HTMLParser.HTMLParser):  
    def __init__(self):  
        self.title = '' 
        self.li = list()
        self.readingtitle = 0 
        HTMLParser.HTMLParser.__init__(self) 
          
          
    def handle_starttag(self, tag, attrs):  
        # 这里重新定义了处理开始标签的函数  
        if tag == 'a':  
            # 判断标签<a>的属性  
            for name,value in attrs:  
                if name == 'href':  
                    self.readingtitle = 1  
                  
    def handle_data(self, data):
        if self.readingtitle: 
            self.title += (data + '&')

    def handle_endtag(self, tag): 
        if tag == 'a': 
            self.readingtitle = 0
            length = len(self.title)      
            self.li.append(self.title[0:length - 1])
            self.title = '' 

    def gettitle(self): 

        return self.title
            
if __name__ == '__main__':  
    a = '<html><head><title>test</title><body><a href="http://www.163.com">链接到163</a></body></html>'  
      
    my = MyHTMLParser()  
    # 传入要分析的数据，是html的。  
    my.feed(a)  

