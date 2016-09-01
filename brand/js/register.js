/**
 * Created by bombvote-zql on 16/8/31.
// */
var validatorRegCode;
var validatorRegister;
var baseUrl = "http://192.168.15.94:4500/api/";
//var regCode;
$(document).ready(function () {
    var regCode;
    $.validator.setDefaults({
        debug: false
    });

    validatorRegCode = $("#codeForm").validate({
        rules: {
                regCode:{
                    required:true,
                    number:true
                }
        },
        messages:{
            regCode:{
                required:"请输入内测码",
                number:"请输入数字"
            }
        },
        highlight: function(element, errorClass, validClass) {
            $(element).addClass(errorClass).removeClass(validClass);
            $(element).fadeOut().fadeIn();
        },
        unhighlight: function(element, errorClass, validClass) {
            $(element).removeClass(errorClass).addClass(validClass);
        },

        submitHandler: function (form) {

            var request;

            regCode = $(form[name="regCode"]).val();
            var $inputs = $(form).find("input, select, button");
            $inputs.prop("disabled", true);
            request = $.ajax({
                url: baseUrl + "OpPublicAPIs/CheckRegCode/",
                type: "post",
                data: {"RegInfo":{"RegCode":$(form[name="regCode"]).val()}}
            });
            //$("#errorTip").html("正在加载......");
            //请求成功后调用
            request.done(function (response, textStatus, jqXHR) {
                if (response.status == 1) {
                    location.href = "login.html?RegCode=" + regCode;
                } else if (response.status == 0){
                    $('#errorTip').html(response.result);
                }
            });

            //请求失败时调用
            request.fail(function (jqXHR, textStatus, errorThrown) {
                errorThing = "cuola ";
                $('#errorTip').html("发生错误");

                console.log("The following error occured: " + textStatus, errorThrown);
            });

            //成功或失败都会回调
            request.always(function () {
                $inputs.prop("disabled", false);
            });
            return false;

        }
    });


    $("#regCode").change(function(){
        $('#errorTip').html("");
    });

    $.getUrlParam = function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return unescape(r[2]); return null;
    }
    //register Login

    $("#smsCode").change(function(){
        $("#smsCode").removeData("previousValue").valid();
    });

   
    validatorRegister = $("#registerForm").validate({
        rules: {
            brandName:{
                required:true
            },
            userName:{
                required:true
            },
            smsCode:{
                required:true,
                number:true,
                remote: {                                          //验证用户名是否存在
                    type: "POST",
                    url: baseUrl + "OpPublicAPIs/CheckSendSMS",             //servlet
                    data: {
                        "CheckSendSMS": {
                            "mobile": function(){
                                return String($("input[name='mobile']").val());
                            },
                            "regcode": function(){
                                return String($("input[name='smsCode']").val());
                            }
                        }
                    },
                    dataFilter:function(data) {
                        var result =  JSON.parse(data);
                        if (result.status != 1) {
                            return false;
                        } else {
                            return true;
                        }
                    }
                }
            },
            mobile:{
                required:true,
                isMobile:true
            },
            password:{
                required:true,
                minlength: 6
            }
          },
        messages:{
            brandName:{
                required:"请填写品牌名"
             },
            userName:{
                required:"请填写用户名"
            },
            smsCode:{
                required:"请输入验证码",
                number:"请输入数字",
                remote:"验证码不正确"

            },
            mobile:{
                required:"请输入手机号码",
                isMobile:"请填写正确的手机号码"

            },
            password:{
                required:"请输入密码",
                minlength: "密码至少6为字符或数字"
            }
        },


        highlight: function(element, errorClass, validClass) {
            $(element).addClass(errorClass).removeClass(validClass);
            $(element).fadeOut().fadeIn();
        },
        unhighlight: function(element, errorClass, validClass) {
            $(element).removeClass(errorClass).addClass(validClass);
        },

        submitHandler: function (form) {

            var request;

            var $inputs = $(form).find("input, select, button");
            $inputs.prop("disabled", true);

            var params = {
                    "BrandInfo":{
                        "Mobile":$(form[name="mobile"]).val(),
                        "Password":$(form[name="password"]).val(),
                        "Name":$(form[name="brandName"]).val(),
                        "RegCode": $.getUrlParam("RegCode"),
                        "RegUserName":$(form[name="userName"]).val()
                    }
            };
            $('#registerError').html("");
            request = $.ajax({
                url: baseUrl + "OpPublicAPIs/RegisterBrand/",
                type: "post",
                data: params
            });
            //请求成功后调用
            request.done(function (response, textStatus, jqXHR) {
                if (response.status == 1) {
                    location.href = "result.html"
                } else if (response.status == 0){
                    $('#registerError').html(response.result);
                }
            });

            //请求失败时调用
            request.fail(function (jqXHR, textStatus, errorThrown) {
                $('#registerError').html(errorThrown);
                console.log("The following error occured: " + textStatus, errorThrown);
            });

            //成功或失败都会回调
            request.always(function () {
                $inputs.prop("disabled", false);
            });
        }
    });



    //增加mobile的验证方法
    $.validator.addMethod("isMobile", function(value, element) {
        var length = value.length;
        var mobile = /^(13[0-9]{9})|(18[0-9]{9})|(14[0-9]{9})|(17[0-9]{9})|(15[0-9]{9})$/;
        return this.optional(element) || (length == 11 && mobile.test(value));
    }, "请正确填写您的手机号码");


    //倒计时
    smsTimer=$.cookie("smsTimer")||60;
    smsDis=$.cookie("smsDis");
    if (smsTimer <= 0) {
        smsTimer = 60;
    }
    function countDown($obj){

        var time;
        if($obj.attr("id")=="getSmsBtn")
        {
            time=--smsTimer;
            $.cookie("smsTimer",time,{"expires":1});
            if(time<=0){
                clearTimer($obj);
                return;
            }
        }
        $obj.text(time+"秒后重新发送")

    };

    function  clearTimer($obj) {
        smsTimer=60;
        $obj[0].disabled= false;
        clearInterval(inter1);
        $obj.text("短信获取验证码");
        $.cookie("smsDis","");
        $obj.removeClass("selected");
    };

    $("#mobile").change(function(){
        $('#registerError').html("");
    });

    $("#getSmsBtn").click(function(){
        $this=$(this);
        var mobile = $("input[name='mobile']").val();
        // validatorRegister.form();

        if (mobile.length == 0) {
            $('#registerError').html("请输入手机号码");
            return ;
        }

        if (smsDis == "smsDis") {
            $("#getSmsBtn")[0].disabled = 'disabled'
            inter1 = setInterval(function () {
                countDown($("#getSmsBtn"))
            }, 1000);
        } else {
            if (!$this[0].disabled) {
                    $this[0].disabled = 'disabled';
                     $this.addClass("selected");
                    $.cookie("smsDis", "smsDis", {"expires": 1});
                    inter1 = setInterval(function () {
                        countDown($this);
                    }, 1000);
            }
        }

        $.ajax({
           url:baseUrl + "OpPublicAPIs/SendSMSRegCode/",
            dataType:'json',
            data:{"SendSMS":{"mobile":mobile}},
            type:'POST',
            success:function(response){
                if (response.status == 1) {

                } else {
                    clearTimer($this);
                }
            },
            error:function(error){
                clearTimer($this);
            }

        });

    });


});
