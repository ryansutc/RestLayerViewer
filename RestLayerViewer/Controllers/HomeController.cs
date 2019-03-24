using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;

using RestLayerViewer.Models;
using Newtonsoft.Json;
using Microsoft.AspNetCore.Http;

namespace RestLayerViewer.Controllers
{
    public class HomeController : Controller
    {

        [HttpGet]
        public IActionResult Index()
        {
            
            ViewData["serviceUrl"] = HttpContext.Session.GetString("serviceUrl");
            ViewData["allFields"] = HttpContext.Session.GetString("allFields");
            ViewData["selectedState"] = HttpContext.Session.GetString("selectedState");
            ViewData["Page"] = "Home";
            return View();
            /*
            HttpContext.Session.SetString("allFields", "FID,OBJECTID,NAME,CLASS,ST,STFIPS,PLACEFIPS,CAPITAL,POP_CLASS,POPULATION,POP2010,WHITE,BLACK,AMERI_ES,ASIAN,HAWN_PI,HISPANIC,OTHER,MULT_RACE,MALES,FEMALES,AGE_UNDER5,AGE_5_9,AGE_10_14,AGE_15_19,AGE_20_24,AGE_25_34,AGE_35_44,AGE_45_54,AGE_55_64,AGE_65_74,AGE_75_84,AGE_85_UP,MED_AGE,MED_AGE_M,MED_AGE_F,HOUSEHOLDS,AVE_HH_SZ,HSEHLD_1_M,HSEHLD_1_F,MARHH_CHD,MARHH_NO_C,MHH_CHILD,FHH_CHILD,FAMILIES,AVE_FAM_SZ,HSE_UNITS,VACANT,OWNER_OCC,RENTER_OCC");
            HttpContext.Session.SetString("selectedState", "1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1");
            HttpContext.Session.SetString("serviceUrl", "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Major_Cities/FeatureServer/0?f=json");
            return RedirectToAction("Data");
            */

        }

        [HttpPost]
        public IActionResult Index(string serviceUrl, string allFields, string selectedState)
        {
            HttpContext.Session.SetString("allFields", allFields);
            HttpContext.Session.SetString("selectedState", selectedState);
            HttpContext.Session.SetString("serviceUrl", serviceUrl);
            //return Content($"Hello {serviceUrl}. Here iz yer fields: {fieldsListHidden}");

            return RedirectToAction("Data");
        }

        public IActionResult About()
        {
            ViewData["Page"] = "About";

            return View();
        }

        public IActionResult Map()
        {
            ViewData["Page"] = "Map";
            ViewData["serviceUrl"] = HttpContext.Session.GetString("serviceUrl");
            ViewData["allFields"] = HttpContext.Session.GetString("allFields");
            ViewData["selectedState"] = HttpContext.Session.GetString("selectedState");
            return View();
        }

        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        public IActionResult Data()
        {
            ViewData["serviceUrl"] = HttpContext.Session.GetString("serviceUrl");
            ViewData["allFields"] = HttpContext.Session.GetString("allFields");
            ViewData["selectedState"] = HttpContext.Session.GetString("selectedState");
            ViewData["Page"] = "Data";
            return View();
        }

        private List<string> _fieldsStringToList(string fieldsString)
        {
            List<string> list = fieldsString.Split(",")
                .Select(s => s.Trim()).ToList();

            return list;
        }

        private string _fieldsListToString(string[] fieldsList)
        {
            if (fieldsList == null)
            {
                return "";
            }
            return String.Join(", ", fieldsList);
        }
    }

    public static class SessionExtensions
    {
        public static void SetObjectAsJson(this ISession session, string key, object value)
        {
            session.SetString(key, JsonConvert.SerializeObject(value));
        }

        public static T GetObjectFromJson<T>(this ISession session, string key)
        {
            var value = session.GetString(key);

            return value == null ? default(T) : JsonConvert.DeserializeObject<T>(value);
        }
    }
}
