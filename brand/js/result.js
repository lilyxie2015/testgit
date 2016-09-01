/**
 * Created by bombvote-zql on 16/9/1.
 */

var time = 3;
jQuery(document).ready(function(){
    var timer = function() {
        setTimeout(function(){
            time -- ;
            if (time<=0) {

                window.location = "http://www.downtown8.com/";
            } else  {
                $("#skipTip").html(time+"秒后自动跳转至业务后台登录");
                timer();
            }
        }, 1000);

    }

    timer();
    //这里实现延迟3秒跳转
});