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
